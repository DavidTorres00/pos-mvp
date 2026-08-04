from datetime import datetime

from sqlalchemy.orm import Session

from app.models.movimiento_inventario import MovimientoInventario, TipoMovimiento
from app.repositories import movimiento_inventario_repository, producto_repository
from app.services import auditoria_service, reorden_service


class ProductoNoEncontradoError(Exception):
    pass


class StockInsuficienteError(Exception):
    pass


def listar_movimientos(
    db: Session,
    producto_id: int | None,
    q: str | None,
    tipo: TipoMovimiento | None,
    desde: datetime | None,
    hasta: datetime | None,
    page: int,
    size: int,
) -> tuple[list[MovimientoInventario], int]:
    return movimiento_inventario_repository.get_all(db, producto_id, q, tipo, desde, hasta, page, size)


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
        producto_id=producto_id,
        tipo=tipo,
        cantidad=cantidad,
        stock_resultante=producto.stock,
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
        {"producto_id": producto_id, "tipo": tipo.value, "cantidad": cantidad, "stock_resultante": producto.stock},
    )

    if tipo == TipoMovimiento.SALIDA:
        reorden_service.disparar_si_corresponde(db, producto_id)

    return movimiento
