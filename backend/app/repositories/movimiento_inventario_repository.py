from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.movimiento_inventario import MovimientoInventario


def get_all(db: Session, producto_id: int | None = None) -> list[MovimientoInventario]:
    stmt = select(MovimientoInventario).order_by(MovimientoInventario.created_at.desc())
    if producto_id is not None:
        stmt = stmt.where(MovimientoInventario.producto_id == producto_id)
    return list(db.scalars(stmt))


def create(db: Session, movimiento: MovimientoInventario) -> MovimientoInventario:
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento
