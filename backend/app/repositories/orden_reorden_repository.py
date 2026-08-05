from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.orden_reorden import EstadoOrdenReorden, OrdenReorden
from app.repositories.pagination import paginar


def get_all(
    db: Session, sucursal_id: int, estado: EstadoOrdenReorden | None, page: int, size: int
) -> tuple[list[OrdenReorden], int]:
    stmt = (
        select(OrdenReorden).where(OrdenReorden.sucursal_id == sucursal_id).order_by(OrdenReorden.created_at.desc())
    )
    if estado is not None:
        stmt = stmt.where(OrdenReorden.estado == estado)
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, orden_id: int) -> OrdenReorden | None:
    return db.get(OrdenReorden, orden_id)


def get_by_id_for_update(db: Session, orden_id: int) -> OrdenReorden | None:
    stmt = select(OrdenReorden).where(OrdenReorden.id == orden_id).with_for_update(of=OrdenReorden)
    return db.scalar(stmt)


def get_pendiente_by_regla(db: Session, regla_reorden_id: int) -> OrdenReorden | None:
    stmt = select(OrdenReorden).where(
        OrdenReorden.regla_reorden_id == regla_reorden_id, OrdenReorden.estado == EstadoOrdenReorden.PENDIENTE
    )
    return db.scalar(stmt)


def sum_pagado_en_fecha(db: Session, fecha: date) -> Decimal:
    stmt = select(func.coalesce(func.sum(OrdenReorden.monto_estimado), 0)).where(
        OrdenReorden.estado == EstadoOrdenReorden.PAGADA, func.date(OrdenReorden.aprobado_at) == fecha
    )
    return db.scalar(stmt) or Decimal("0")


def create(db: Session, orden: OrdenReorden) -> OrdenReorden:
    db.add(orden)
    db.flush()
    return orden


def save(db: Session, orden: OrdenReorden) -> OrdenReorden:
    db.flush()
    return orden
