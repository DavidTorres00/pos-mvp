from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.movimiento_caja import MovimientoCaja


def get_abierta(db: Session) -> CajaSesion | None:
    return db.scalar(select(CajaSesion).where(CajaSesion.abierta.is_(True)))


def get_ultima_cerrada(db: Session) -> CajaSesion | None:
    stmt = select(CajaSesion).where(CajaSesion.abierta.is_(False)).order_by(CajaSesion.fecha_cierre.desc()).limit(1)
    return db.scalar(stmt)


def get_by_id(db: Session, caja_id: int) -> CajaSesion | None:
    return db.get(CajaSesion, caja_id)


def create(db: Session, caja: CajaSesion) -> CajaSesion:
    db.add(caja)
    db.commit()
    db.refresh(caja)
    return caja


def save(db: Session, caja: CajaSesion) -> CajaSesion:
    db.commit()
    db.refresh(caja)
    return caja


def get_movimientos(db: Session, caja_id: int) -> list[MovimientoCaja]:
    stmt = select(MovimientoCaja).where(MovimientoCaja.caja_id == caja_id).order_by(MovimientoCaja.created_at.desc())
    return list(db.scalars(stmt))


def crear_movimiento(db: Session, movimiento: MovimientoCaja) -> MovimientoCaja:
    db.add(movimiento)
    db.commit()
    db.refresh(movimiento)
    return movimiento
