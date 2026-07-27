from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select


def paginar[T](db: Session, stmt: Select[tuple[T]], page: int, size: int) -> tuple[list[T], int]:
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    items = list(db.scalars(stmt.offset((page - 1) * size).limit(size)))
    return items, total
