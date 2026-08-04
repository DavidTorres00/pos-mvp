from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auditoria import Auditoria
from app.repositories.pagination import paginar


def create(db: Session, evento: Auditoria) -> Auditoria:
    db.add(evento)
    db.flush()
    return evento


def get_all(
    db: Session,
    usuario_id: int | None,
    entidad: str | None,
    desde: datetime | None,
    hasta: datetime | None,
    page: int,
    size: int,
) -> tuple[list[Auditoria], int]:
    stmt = select(Auditoria).order_by(Auditoria.created_at.desc())
    if usuario_id is not None:
        stmt = stmt.where(Auditoria.usuario_id == usuario_id)
    if entidad is not None:
        stmt = stmt.where(Auditoria.entidad == entidad)
    if desde is not None:
        stmt = stmt.where(Auditoria.created_at >= desde)
    if hasta is not None:
        # 'hasta' llega como fecha (medianoche); se incluye el día completo, no solo hasta las 00:00
        stmt = stmt.where(Auditoria.created_at < hasta + timedelta(days=1))
    return paginar(db, stmt, page, size)
