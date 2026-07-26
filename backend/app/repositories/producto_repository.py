from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.producto import Producto


def get_all(db: Session, q: str | None = None) -> list[Producto]:
    stmt = select(Producto).order_by(Producto.nombre)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(Producto.nombre.ilike(pattern), Producto.sku.ilike(pattern)))
    return list(db.scalars(stmt))


def get_by_id(db: Session, producto_id: int) -> Producto | None:
    return db.get(Producto, producto_id)


def get_by_sku(db: Session, sku: str) -> Producto | None:
    return db.scalar(select(Producto).where(Producto.sku == sku))


def create(db: Session, producto: Producto) -> Producto:
    db.add(producto)
    db.commit()
    db.refresh(producto)
    return producto


def save(db: Session, producto: Producto) -> Producto:
    db.commit()
    db.refresh(producto)
    return producto
