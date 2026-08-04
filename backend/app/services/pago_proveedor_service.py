from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.openpay_client import OpenPayError
from app.core.openpay_client import crear_payout as openpay_crear_payout
from app.models.orden_reorden import EstadoOrdenReorden, OrdenReorden
from app.models.usuario import Usuario
from app.repositories import configuracion_repository, orden_reorden_repository, proveedor_repository
from app.services import auditoria_service
from app.services.reorden_service import OrdenNoEncontradaError, OrdenNoPendienteError


class TopeGastoExcedidoError(Exception):
    def __init__(self, tipo: str):
        self.tipo = tipo


class ProveedorSinDatosPagoError(Exception):
    pass


def aprobar_y_pagar(db: Session, admin: Usuario, orden_id: int) -> OrdenReorden:
    """V1 (§4.6): siempre requiere esta llamada explícita del admin, nunca se paga solo. Tope
    de gasto por orden y diario, y el proveedor debe tener CLABE cargada.

    Si OpenPay falla, la orden queda en estado ERROR (no PENDIENTE, para no reintentarla
    automáticamente sin revisión) y la función retorna igual sin lanzar excepción: la
    aprobación en sí se procesó correctamente, el resultado del intento de pago se refleja en
    `estado`/`error` de la orden devuelta. Lanzar una excepción aquí revertiría con ella el
    propio registro de la falla, por la transacción única de la request (mismo motivo que el
    login fallido en auth_service)."""
    orden = orden_reorden_repository.get_by_id_for_update(db, orden_id)
    if orden is None:
        raise OrdenNoEncontradaError(orden_id)
    if orden.estado != EstadoOrdenReorden.PENDIENTE:
        raise OrdenNoPendienteError(orden_id)

    # lock de la fila única de configuración: serializa esta aprobación contra cualquier otra
    # aprobación concurrente para que el tope diario se respete incluso bajo carrera
    configuracion = configuracion_repository.get_for_update(db)

    if configuracion.openpay_tope_por_orden is not None and orden.monto_estimado > configuracion.openpay_tope_por_orden:
        raise TopeGastoExcedidoError("orden")

    hoy = datetime.now(timezone.utc).date()
    gastado_hoy = orden_reorden_repository.sum_pagado_en_fecha(db, hoy)
    if (
        configuracion.openpay_tope_diario is not None
        and gastado_hoy + orden.monto_estimado > configuracion.openpay_tope_diario
    ):
        raise TopeGastoExcedidoError("diario")

    proveedor = proveedor_repository.get_by_id(db, orden.proveedor_id)
    if proveedor is None or not proveedor.clabe:
        raise ProveedorSinDatosPagoError(orden.proveedor_id)

    orden.aprobado_por_id = admin.id
    orden.aprobado_at = datetime.now(timezone.utc)

    try:
        payment_id = openpay_crear_payout(
            orden.monto_estimado,
            proveedor.clabe,
            proveedor.nombre,
            f"Orden de reorden #{orden.id}",
            referencia=f"orden-reorden-{orden.id}",
        )
    except OpenPayError as exc:
        orden.estado = EstadoOrdenReorden.ERROR
        orden.error = str(exc)[:500]
        orden = orden_reorden_repository.save(db, orden)
        auditoria_service.registrar(
            db, admin.id, "pago_proveedor_error", "orden_reorden", orden.id, {"error": orden.error}
        )
        return orden

    orden.estado = EstadoOrdenReorden.PAGADA
    orden.openpay_payment_id = payment_id
    orden = orden_reorden_repository.save(db, orden)
    auditoria_service.registrar(
        db,
        admin.id,
        "pago_proveedor_aprobado",
        "orden_reorden",
        orden.id,
        {"monto": str(orden.monto_estimado), "openpay_payment_id": payment_id},
    )
    return orden
