from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.venta import Venta


def get_all(db: Session) -> list[Venta]:
    return list(db.scalars(select(Venta).order_by(Venta.created_at.desc())))


def get_by_id(db: Session, venta_id: int) -> Venta | None:
    return db.get(Venta, venta_id)


def create(db: Session, venta: Venta) -> Venta:
    db.add(venta)
    db.commit()
    db.refresh(venta)
    return venta
