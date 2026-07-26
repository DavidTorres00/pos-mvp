from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.compra import Compra


def get_all(db: Session) -> list[Compra]:
    return list(db.scalars(select(Compra).order_by(Compra.created_at.desc())))


def get_by_id(db: Session, compra_id: int) -> Compra | None:
    return db.get(Compra, compra_id)


def create(db: Session, compra: Compra) -> Compra:
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return compra
