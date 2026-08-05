from datetime import datetime

from sqlalchemy.orm import Session

from app.models.movimiento_inventario import MovimientoInventario, TipoMovimiento
from app.repositories import movimiento_inventario_repository, producto_repository, stock_sucursal_repository
from app.services import auditoria_service, reorden_service


class ProductoNoEncontradoError(Exception):
    pass


class StockInsuficienteError(Exception):
    pass


def listar_movimientos(
    db: Session,
    sucursal_id: int,
    producto_id: int | None,
    q: str | None,
    tipo: TipoMovimiento | None,
    desde: datetime | None,
    hasta: datetime | None,
    page: int,
    size: int,
) -> tuple[list[MovimientoInventario], int]:
    return movimiento_inventario_repository.get_all(db, sucursal_id, producto_id, q, tipo, desde, hasta, page, size)


def registrar_movimiento(
    db: Session,
    usuario_id: int,
    producto_id: int,
    sucursal_id: int,
    tipo: TipoMovimiento,
    cantidad: int,
    motivo: str | None = None,
) -> MovimientoInventario:
    if producto_repository.get_by_id(db, producto_id) is None:
        raise ProductoNoEncontradoError(producto_id)

    # el stock ya no vive en Producto: el lock es sobre la fila de stock_sucursal de esta sucursal
    stock = stock_sucursal_repository.get_or_create_for_update(db, producto_id, sucursal_id)
    if tipo == TipoMovimiento.SALIDA and cantidad > stock.cantidad:
        raise StockInsuficienteError(producto_id)

    stock.cantidad += cantidad if tipo == TipoMovimiento.ENTRADA else -cantidad
    stock_sucursal_repository.save(db, stock)

    movimiento = MovimientoInventario(
        producto_id=producto_id,
        sucursal_id=sucursal_id,
        tipo=tipo,
        cantidad=cantidad,
        stock_resultante=stock.cantidad,
        motivo=motivo,
        usuario_id=usuario_id,
    )
    movimiento = movimiento_inventario_repository.create(db, movimiento)
    auditoria_service.registrar(
        db,
        usuario_id,
        "movimiento_inventario_registrado",
        "movimiento_inventario",
        movimiento.id,
        {"producto_id": producto_id, "tipo": tipo.value, "cantidad": cantidad, "stock_resultante": stock.cantidad},
    )

    if tipo == TipoMovimiento.SALIDA:
        reorden_service.disparar_si_corresponde(db, producto_id, sucursal_id)

    return movimiento
