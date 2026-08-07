from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.openpay_client import OpenPayError
from app.core.openpay_client import crear_payout as openpay_crear_payout
from app.models.compra import Compra, EstadoCompra
from app.models.detalle_compra import DetalleCompra
from app.models.movimiento_inventario import TipoMovimiento
from app.repositories import compra_repository, producto_repository, proveedor_repository
from app.schemas.compra import CompraItemCreate, CompraRecibirItem
from app.services import auditoria_service, inventario_service


class ProductoInvalidoError(Exception):
    pass


class ProveedorInvalidoError(Exception):
    pass


class CompraNoEncontradaError(Exception):
    pass


class CompraNoPendienteError(Exception):
    pass


class CompraNoPagadaError(Exception):
    pass


class ProveedorSinDatosPagoError(Exception):
    pass


class DetalleIncompletoError(Exception):
    """El payload de recepción no cubre exactamente los productos de la compra."""


def listar(
    db: Session, sucursal_id: int, proveedor_id: int | None, page: int, size: int
) -> tuple[list[Compra], int]:
    return compra_repository.get_all(db, sucursal_id, proveedor_id, page, size)


def obtener(db: Session, compra_id: int) -> Compra:
    compra = compra_repository.get_by_id(db, compra_id)
    if compra is None:
        raise CompraNoEncontradaError(compra_id)
    return compra


def crear(
    db: Session, usuario_id: int, proveedor_id: int, sucursal_id: int, items: list[CompraItemCreate]
) -> Compra:
    """Arma el pedido: queda `pendiente`, sin tocar Inventario ni disparar ningún pago — eso
    pasa recién en `aprobar_y_pagar`/`recibir` (ver docs/BACKEND.md)."""
    if proveedor_repository.get_by_id(db, proveedor_id) is None:
        raise ProveedorInvalidoError(proveedor_id)
    for item in items:
        if producto_repository.get_by_id(db, item.producto_id) is None:
            raise ProductoInvalidoError(item.producto_id)

    total = sum((item.cantidad * item.costo_unitario for item in items), Decimal("0"))
    compra = Compra(proveedor_id=proveedor_id, sucursal_id=sucursal_id, total=total, usuario_id=usuario_id)
    compra.items = [
        DetalleCompra(
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            costo_unitario=item.costo_unitario,
            subtotal=item.cantidad * item.costo_unitario,
        )
        for item in items
    ]
    compra = compra_repository.create(db, compra)

    auditoria_service.registrar(
        db, usuario_id, "compra_creada", "compra", compra.id, {"total": str(total), "proveedor_id": proveedor_id}
    )
    return compra


def aprobar_y_pagar(db: Session, admin_id: int, compra_id: int) -> Compra:
    """Siempre requiere esta llamada explícita del admin, nunca se paga solo. Sin tope de gasto
    (decisión deliberada, ver docs/BACKEND.md: la revisión manual de cada pedido ya es el
    control) — solo exige que el proveedor tenga CLABE cargada.

    Si OpenPay falla, la compra queda en `error` (no vuelve a `pendiente`, para no reintentarse
    sola sin revisión) y la función retorna igual sin lanzar excepción — lanzarla revertiría con
    la transacción de la request el propio registro de la falla (mismo motivo que el login
    fallido en auth_service)."""
    compra = compra_repository.get_by_id_for_update(db, compra_id)
    if compra is None:
        raise CompraNoEncontradaError(compra_id)
    if compra.estado != EstadoCompra.PENDIENTE:
        raise CompraNoPendienteError(compra_id)

    proveedor = proveedor_repository.get_by_id(db, compra.proveedor_id)
    if proveedor is None or not proveedor.clabe:
        raise ProveedorSinDatosPagoError(compra.proveedor_id)

    try:
        payment_id = openpay_crear_payout(
            compra.total, proveedor.clabe, proveedor.nombre, f"Compra #{compra.id}", referencia=f"compra-{compra.id}"
        )
    except OpenPayError as exc:
        compra.estado = EstadoCompra.ERROR
        compra.error = str(exc)[:500]
        compra = compra_repository.save(db, compra)
        auditoria_service.registrar(db, admin_id, "compra_pago_error", "compra", compra.id, {"error": compra.error})
        return compra

    compra.estado = EstadoCompra.PAGADA
    compra.aprobado_por_id = admin_id
    compra.aprobado_at = datetime.now(timezone.utc)
    compra.openpay_payment_id = payment_id
    compra.error = None
    compra = compra_repository.save(db, compra)
    auditoria_service.registrar(
        db, admin_id, "compra_pagada", "compra", compra.id, {"total": str(compra.total), "openpay_payment_id": payment_id}
    )
    return compra


def rechazar(db: Session, usuario_id: int, compra_id: int) -> Compra:
    compra = compra_repository.get_by_id_for_update(db, compra_id)
    if compra is None:
        raise CompraNoEncontradaError(compra_id)
    if compra.estado != EstadoCompra.PENDIENTE:
        raise CompraNoPendienteError(compra_id)
    compra.estado = EstadoCompra.RECHAZADA
    compra = compra_repository.save(db, compra)
    auditoria_service.registrar(db, usuario_id, "compra_rechazada", "compra", compra.id)
    return compra


def recibir(db: Session, usuario_id: int, compra_id: int, items: list[CompraRecibirItem]) -> Compra:
    """La mercancía llegó a la sucursal — recién aquí se generan los movimientos de entrada en
    Inventario, con la cantidad que de verdad llegó (puede diferir de lo pedido). `items` debe
    cubrir exactamente los productos de la compra, uno por uno — sin default implícito, para no
    adivinar qué llegó y qué no."""
    compra = compra_repository.get_by_id_for_update(db, compra_id)
    if compra is None:
        raise CompraNoEncontradaError(compra_id)
    if compra.estado != EstadoCompra.PAGADA:
        raise CompraNoPagadaError(compra_id)

    cantidades_por_producto = {item.producto_id: item.cantidad_recibida for item in items}
    if set(cantidades_por_producto) != {detalle.producto_id for detalle in compra.items}:
        raise DetalleIncompletoError(compra_id)

    for detalle in compra.items:
        cantidad_recibida = cantidades_por_producto[detalle.producto_id]
        detalle.cantidad_recibida = cantidad_recibida
        if cantidad_recibida > 0:
            inventario_service.registrar_movimiento(
                db,
                usuario_id,
                detalle.producto_id,
                compra.sucursal_id,
                TipoMovimiento.ENTRADA,
                cantidad_recibida,
                motivo=f"Compra #{compra.id}",
            )

    compra.estado = EstadoCompra.RECIBIDA
    compra.recibido_por_id = usuario_id
    compra.recibido_at = datetime.now(timezone.utc)
    compra = compra_repository.save(db, compra)
    auditoria_service.registrar(
        db, usuario_id, "compra_recibida", "compra", compra.id, {"cantidades": cantidades_por_producto}
    )
    return compra
