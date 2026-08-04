from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.proveedor import Proveedor
from app.repositories.pagination import paginar


def get_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Proveedor], int]:
    stmt = select(Proveedor).order_by(Proveedor.nombre)
    if q:
        stmt = stmt.where(Proveedor.nombre.ilike(f"%{q}%"))
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, proveedor_id: int) -> Proveedor | None:
    return db.get(Proveedor, proveedor_id)


def get_by_nombre(db: Session, nombre: str) -> Proveedor | None:
    return db.scalar(select(Proveedor).where(Proveedor.nombre == nombre))


def create(db: Session, proveedor: Proveedor) -> Proveedor:
    db.add(proveedor)
    db.flush()
    return proveedor


def save(db: Session, proveedor: Proveedor) -> Proveedor:
    db.flush()
    return proveedor
