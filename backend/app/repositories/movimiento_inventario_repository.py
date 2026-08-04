from datetime import datetime, timedelta

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.movimiento_inventario import MovimientoInventario, TipoMovimiento
from app.models.producto import Producto
from app.repositories.pagination import paginar


def get_all(
    db: Session,
    producto_id: int | None,
    q: str | None,
    tipo: TipoMovimiento | None,
    desde: datetime | None,
    hasta: datetime | None,
    page: int,
    size: int,
) -> tuple[list[MovimientoInventario], int]:
    stmt = select(MovimientoInventario).order_by(MovimientoInventario.created_at.desc())
    if producto_id is not None:
        stmt = stmt.where(MovimientoInventario.producto_id == producto_id)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.join(Producto).where(or_(Producto.nombre.ilike(pattern), Producto.sku.ilike(pattern)))
    if tipo is not None:
        stmt = stmt.where(MovimientoInventario.tipo == tipo)
    if desde is not None:
        stmt = stmt.where(MovimientoInventario.created_at >= desde)
    if hasta is not None:
        # 'hasta' llega como fecha (medianoche); se incluye el día completo, no solo hasta las 00:00
        stmt = stmt.where(MovimientoInventario.created_at < hasta + timedelta(days=1))
    return paginar(db, stmt, page, size)


def create(db: Session, movimiento: MovimientoInventario) -> MovimientoInventario:
    db.add(movimiento)
    db.flush()
    return movimiento
