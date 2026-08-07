from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compra import Compra
from app.repositories.pagination import paginar


def get_all(
    db: Session, sucursal_id: int, proveedor_id: int | None, page: int, size: int
) -> tuple[list[Compra], int]:
    stmt = select(Compra).where(Compra.sucursal_id == sucursal_id).order_by(Compra.created_at.desc())
    if proveedor_id is not None:
        stmt = stmt.where(Compra.proveedor_id == proveedor_id)
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, compra_id: int) -> Compra | None:
    return db.get(Compra, compra_id)


def get_by_id_for_update(db: Session, compra_id: int) -> Compra | None:
    stmt = select(Compra).where(Compra.id == compra_id).with_for_update(of=Compra)
    return db.scalar(stmt)


def create(db: Session, compra: Compra) -> Compra:
    db.add(compra)
    db.flush()
    return compra


def save(db: Session, compra: Compra) -> Compra:
    db.flush()
    return compra
