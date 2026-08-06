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


def get_recientes_por_accion(db: Session, accion: str, desde: datetime) -> list[Auditoria]:
    """Sin paginar — usado por el reporte de atención del dashboard admin, que necesita
    inspeccionar `detalle` en Python (JSON genérico, no jsonb: no hay operador de containment
    eficiente para filtrar `diferencia < 0` en SQL, y el volumen de cierres de caja no lo
    justifica)."""
    stmt = (
        select(Auditoria)
        .where(Auditoria.accion == accion, Auditoria.created_at >= desde)
        .order_by(Auditoria.created_at.desc())
    )
    return list(db.scalars(stmt))
