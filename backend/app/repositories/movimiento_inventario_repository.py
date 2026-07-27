from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.movimiento_inventario import MovimientoInventario
from app.repositories.pagination import paginar


def get_all(
    db: Session, producto_id: int | None, page: int, size: int
) -> tuple[list[MovimientoInventario], int]:
    stmt = select(MovimientoInventario).order_by(MovimientoInventario.created_at.desc())
    if producto_id is not None:
        stmt = stmt.where(MovimientoInventario.producto_id == producto_id)
    return paginar(db, stmt, page, size)


def create(db: Session, movimiento: MovimientoInventario) -> MovimientoInventario:
    db.add(movimiento)
    db.flush()
    return movimiento
