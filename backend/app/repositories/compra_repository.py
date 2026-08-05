from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compra import Compra
from app.repositories.pagination import paginar


def get_all(db: Session, sucursal_id: int, page: int, size: int) -> tuple[list[Compra], int]:
    stmt = select(Compra).where(Compra.sucursal_id == sucursal_id).order_by(Compra.created_at.desc())
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, compra_id: int) -> Compra | None:
    return db.get(Compra, compra_id)


def create(db: Session, compra: Compra) -> Compra:
    db.add(compra)
    db.flush()
    return compra
