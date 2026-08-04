from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.regla_reorden import ReglaReorden
from app.repositories.pagination import paginar


def get_all(db: Session, page: int, size: int) -> tuple[list[ReglaReorden], int]:
    stmt = select(ReglaReorden).order_by(ReglaReorden.created_at.desc())
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, regla_id: int) -> ReglaReorden | None:
    return db.get(ReglaReorden, regla_id)


def get_by_producto(db: Session, producto_id: int) -> ReglaReorden | None:
    return db.scalar(select(ReglaReorden).where(ReglaReorden.producto_id == producto_id))


def create(db: Session, regla: ReglaReorden) -> ReglaReorden:
    db.add(regla)
    db.flush()
    return regla


def save(db: Session, regla: ReglaReorden) -> ReglaReorden:
    db.flush()
    return regla
