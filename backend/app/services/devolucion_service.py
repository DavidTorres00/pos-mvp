from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.devolucion import DetalleDevolucion, Devolucion
from app.models.movimiento_caja import MovimientoCaja, TipoMovimientoCaja
from app.models.movimiento_inventario import TipoMovimiento
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import EstadoVenta, FormaPago
from app.repositories import caja_repository, devolucion_repository, venta_repository
from app.schemas.devolucion import DevolucionItemCreate
from app.services import auditoria_service, inventario_service

VENTANA_DEVOLUCION_HORAS = 24


class VentaNoEncontradaError(Exception):
    pass


class FueraDePlazoError(Exception):
    pass


class VentaCanceladaError(Exception):
    pass


class SinPermisoError(Exception):
    pass


class LineaInvalidaError(Exception):
    """La línea no pertenece a la venta, la cantidad es <= 0, o excede lo disponible (lo vendido
    menos lo ya devuelto antes)."""

    def __init__(self, detalle_venta_id: int):
        self.detalle_venta_id = detalle_venta_id


class SinLineasError(Exception):
    pass


class CajaNoAbiertaError(Exception):
    pass


def crear(
    db: Session, actor: Usuario, venta_id: int, items: list[DevolucionItemCreate], motivo: str
) -> Devolucion:
    venta = venta_repository.get_by_id(db, venta_id)
    if venta is None:
        raise VentaNoEncontradaError(venta_id)

    if venta.estado == EstadoVenta.CANCELADA:
        raise VentaCanceladaError()

    if datetime.now(UTC) - venta.created_at > timedelta(hours=VENTANA_DEVOLUCION_HORAS):
        raise FueraDePlazoError()

    # admin siempre puede; el cajero solo con el permiso explícito (mismo patrón que
    # puede_retirar_excedente) — sin restringir además a "su propia venta": el ticket ya es la
    # prueba de compra, cualquier cajero con el permiso puede procesarlo
    if actor.role != RolUsuario.ADMIN and not actor.puede_hacer_devoluciones:
        raise SinPermisoError()

    detalles_por_id = {detalle.id: detalle for detalle in venta.items}
    lineas: list[DetalleDevolucion] = []
    monto_total = Decimal("0")
    for item in items:
        detalle = detalles_por_id.get(item.detalle_venta_id)
        if detalle is None or item.cantidad <= 0:
            raise LineaInvalidaError(item.detalle_venta_id)
        ya_devuelto = devolucion_repository.get_cantidad_devuelta(db, detalle.id)
        if item.cantidad > detalle.cantidad - ya_devuelto:
            raise LineaInvalidaError(item.detalle_venta_id)
        subtotal = item.cantidad * detalle.precio_unitario
        monto_total += subtotal
        lineas.append(DetalleDevolucion(detalle_venta_id=detalle.id, cantidad=item.cantidad, subtotal=subtotal))
    if not lineas:
        raise SinLineasError()

    # reingresa el stock a la sucursal donde ocurrió la venta original — no a la del actor, que
    # puede estar procesando la devolución de forma remota (admin) o desde otra sucursal
    sucursal_id = venta.caja.equipo.sucursal_id
    for linea in lineas:
        detalle = detalles_por_id[linea.detalle_venta_id]
        inventario_service.registrar_movimiento(
            db,
            actor.id,
            detalle.producto_id,
            sucursal_id,
            TipoMovimiento.ENTRADA,
            linea.cantidad,
            motivo=f"Devolución venta #{venta.id}",
        )

    # el efectivo sale de la caja que el actor tiene abierta AHORA, nunca de la caja original de
    # la venta (puede ya estar cerrada — es un corte final e inmutable, no se reabre para
    # ajustarlo). Tarjeta/transferencia nunca tocan caja, igual que en la venta original.
    movimiento_caja_id: int | None = None
    if venta.forma_pago == FormaPago.EFECTIVO:
        caja_actor = caja_repository.get_abierta_for_update_by_usuario(db, actor.id)
        if caja_actor is not None:
            movimiento = MovimientoCaja(
                caja_id=caja_actor.id,
                usuario_id=actor.id,
                tipo=TipoMovimientoCaja.SALIDA,
                monto=monto_total,
                motivo=f"Devolución venta #{venta.id}",
            )
            movimiento = caja_repository.crear_movimiento(db, movimiento)
            movimiento_caja_id = movimiento.id
        elif actor.role != RolUsuario.ADMIN:
            # un cajero no puede devolver efectivo que no tiene de dónde sacar
            raise CajaNoAbiertaError()
        # admin sin caja abierta: la devolución se registra igual (stock ya revertido arriba),
        # solo que sin movimiento de caja — mismo criterio que el retiro de excedente remoto, el
        # admin no maneja el efectivo físico de una sucursal en la que no está parado

    devolucion = Devolucion(
        venta_id=venta.id, actor_id=actor.id, motivo=motivo, monto_total=monto_total, movimiento_caja_id=movimiento_caja_id
    )
    devolucion.items = lineas
    devolucion = devolucion_repository.create(db, devolucion)

    auditoria_service.registrar(
        db,
        actor.id,
        "venta_devuelta",
        "venta",
        venta.id,
        {"devolucion_id": devolucion.id, "monto_total": str(monto_total), "motivo": motivo},
    )
    return devolucion


def listar_por_venta(db: Session, venta_id: int) -> list[Devolucion]:
    return devolucion_repository.get_by_venta(db, venta_id)
