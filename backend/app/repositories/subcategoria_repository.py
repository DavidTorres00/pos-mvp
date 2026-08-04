from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.subcategoria import Subcategoria
from app.repositories.pagination import paginar


def get_all(db: Session, categoria_id: int | None, page: int, size: int) -> tuple[list[Subcategoria], int]:
    stmt = select(Subcategoria).order_by(Subcategoria.codigo)
    if categoria_id is not None:
        stmt = stmt.where(Subcategoria.categoria_id == categoria_id)
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, subcategoria_id: int) -> Subcategoria | None:
    return db.get(Subcategoria, subcategoria_id)


def get_by_nombre(db: Session, categoria_id: int, nombre: str) -> Subcategoria | None:
    return db.scalar(
        select(Subcategoria).where(Subcategoria.categoria_id == categoria_id, Subcategoria.nombre == nombre)
    )


def get_max_codigo(db: Session, categoria_id: int) -> str | None:
    return db.scalar(select(func.max(Subcategoria.codigo)).where(Subcategoria.categoria_id == categoria_id))


def create(db: Session, subcategoria: Subcategoria) -> Subcategoria:
    db.add(subcategoria)
    db.flush()
    return subcategoria


def save(db: Session, subcategoria: Subcategoria) -> Subcategoria:
    db.flush()
    return subcategoria
