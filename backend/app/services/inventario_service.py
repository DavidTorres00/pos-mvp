from sqlalchemy.orm import Session

from app.models.movimiento_inventario import MovimientoInventario, TipoMovimiento
from app.repositories import movimiento_inventario_repository, producto_repository


class ProductoNoEncontradoError(Exception):
    pass


class StockInsuficienteError(Exception):
    pass


def listar_movimientos(
    db: Session, producto_id: int | None, page: int, size: int
) -> tuple[list[MovimientoInventario], int]:
    return movimiento_inventario_repository.get_all(db, producto_id, page, size)


def registrar_movimiento(
    db: Session, usuario_id: int, producto_id: int, tipo: TipoMovimiento, cantidad: int, motivo: str | None = None
) -> MovimientoInventario:
    producto = producto_repository.get_by_id_for_update(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)

    if tipo == TipoMovimiento.SALIDA and cantidad > producto.stock:
        raise StockInsuficienteError(producto_id)

    producto.stock += cantidad if tipo == TipoMovimiento.ENTRADA else -cantidad

    movimiento = MovimientoInventario(
        producto_id=producto_id, tipo=tipo, cantidad=cantidad, motivo=motivo, usuario_id=usuario_id
    )
    return movimiento_inventario_repository.create(db, movimiento)
