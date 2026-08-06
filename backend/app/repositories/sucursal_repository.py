from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sucursal import Sucursal
from app.repositories.pagination import paginar


def get_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Sucursal], int]:
    stmt = select(Sucursal).order_by(Sucursal.nombre)
    if q:
        stmt = stmt.where(Sucursal.nombre.ilike(f"%{q}%"))
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, sucursal_id: int) -> Sucursal | None:
    return db.get(Sucursal, sucursal_id)


def get_activas(db: Session) -> list[Sucursal]:
    return list(db.scalars(select(Sucursal).where(Sucursal.activo.is_(True)).order_by(Sucursal.nombre)))


def get_by_nombre(db: Session, nombre: str) -> Sucursal | None:
    return db.scalar(select(Sucursal).where(Sucursal.nombre == nombre))


def create(db: Session, sucursal: Sucursal) -> Sucursal:
    db.add(sucursal)
    db.flush()
    return sucursal


def save(db: Session, sucursal: Sucursal) -> Sucursal:
    db.flush()
    return sucursal
