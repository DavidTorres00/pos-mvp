from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.repositories.pagination import paginar


def get_all(db: Session, sucursal_id: int | None, page: int, size: int) -> tuple[list[Equipo], int]:
    stmt = select(Equipo).order_by(Equipo.nombre)
    if sucursal_id is not None:
        stmt = stmt.where(Equipo.sucursal_id == sucursal_id)
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, equipo_id: int) -> Equipo | None:
    return db.get(Equipo, equipo_id)


def get_by_nombre(db: Session, sucursal_id: int, nombre: str) -> Equipo | None:
    return db.scalar(select(Equipo).where(Equipo.sucursal_id == sucursal_id, Equipo.nombre == nombre))


def get_activos_by_sucursal(db: Session, sucursal_id: int) -> list[Equipo]:
    stmt = select(Equipo).where(Equipo.sucursal_id == sucursal_id, Equipo.activo.is_(True)).order_by(Equipo.nombre)
    return list(db.scalars(stmt))


def create(db: Session, equipo: Equipo) -> Equipo:
    db.add(equipo)
    db.flush()
    return equipo


def save(db: Session, equipo: Equipo) -> Equipo:
    db.flush()
    return equipo
