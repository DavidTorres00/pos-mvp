from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.venta import Venta
from app.repositories.pagination import paginar


def get_all(db: Session, page: int, size: int) -> tuple[list[Venta], int]:
    stmt = select(Venta).order_by(Venta.created_at.desc())
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, venta_id: int) -> Venta | None:
    return db.get(Venta, venta_id)


def create(db: Session, venta: Venta) -> Venta:
    db.add(venta)
    db.flush()
    return venta
