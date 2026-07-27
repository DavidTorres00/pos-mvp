from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.repositories.pagination import paginar


def get_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Producto], int]:
    stmt = select(Producto).order_by(Producto.nombre)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(Producto.nombre.ilike(pattern), Producto.sku.ilike(pattern)))
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, producto_id: int) -> Producto | None:
    return db.get(Producto, producto_id)


def get_by_id_for_update(db: Session, producto_id: int) -> Producto | None:
    stmt = select(Producto).where(Producto.id == producto_id).with_for_update(of=Producto)
    return db.scalar(stmt)


def get_by_sku(db: Session, sku: str) -> Producto | None:
    return db.scalar(select(Producto).where(Producto.sku == sku))


def create(db: Session, producto: Producto) -> Producto:
    db.add(producto)
    db.flush()
    return producto


def save(db: Session, producto: Producto) -> Producto:
    db.flush()
    return producto
