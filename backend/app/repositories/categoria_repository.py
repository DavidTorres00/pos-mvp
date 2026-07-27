from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.categoria import Categoria
from app.repositories.pagination import paginar


def get_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Categoria], int]:
    stmt = select(Categoria).order_by(Categoria.nombre)
    if q:
        stmt = stmt.where(Categoria.nombre.ilike(f"%{q}%"))
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, categoria_id: int) -> Categoria | None:
    return db.get(Categoria, categoria_id)


def get_by_nombre(db: Session, nombre: str) -> Categoria | None:
    return db.scalar(select(Categoria).where(Categoria.nombre == nombre))


def create(db: Session, categoria: Categoria) -> Categoria:
    db.add(categoria)
    db.flush()
    return categoria


def save(db: Session, categoria: Categoria) -> Categoria:
    db.flush()
    return categoria
