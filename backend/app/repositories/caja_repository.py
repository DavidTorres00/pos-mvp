from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.movimiento_caja import MovimientoCaja
from app.repositories.pagination import paginar


def get_abierta_by_usuario(db: Session, usuario_id: int) -> CajaSesion | None:
    return db.scalar(select(CajaSesion).where(CajaSesion.abierta.is_(True), CajaSesion.usuario_id == usuario_id))


def get_abierta_for_update_by_usuario(db: Session, usuario_id: int) -> CajaSesion | None:
    stmt = (
        select(CajaSesion)
        .where(CajaSesion.abierta.is_(True), CajaSesion.usuario_id == usuario_id)
        .with_for_update(of=CajaSesion)
    )
    return db.scalar(stmt)


def get_abierta_by_equipo(db: Session, equipo_id: int) -> CajaSesion | None:
    return db.scalar(select(CajaSesion).where(CajaSesion.abierta.is_(True), CajaSesion.equipo_id == equipo_id))


def get_abiertas(db: Session) -> list[CajaSesion]:
    return list(db.scalars(select(CajaSesion).where(CajaSesion.abierta.is_(True))))


def get_ultima_cerrada_by_usuario(db: Session, usuario_id: int) -> CajaSesion | None:
    stmt = (
        select(CajaSesion)
        .where(CajaSesion.abierta.is_(False), CajaSesion.usuario_id == usuario_id)
        .order_by(CajaSesion.fecha_cierre.desc())
        .limit(1)
    )
    return db.scalar(stmt)


def get_by_id(db: Session, caja_id: int) -> CajaSesion | None:
    return db.get(CajaSesion, caja_id)


def create(db: Session, caja: CajaSesion) -> CajaSesion:
    db.add(caja)
    db.flush()
    return caja


def save(db: Session, caja: CajaSesion) -> CajaSesion:
    db.flush()
    return caja


def get_movimientos(db: Session, caja_id: int, page: int, size: int) -> tuple[list[MovimientoCaja], int]:
    stmt = select(MovimientoCaja).where(MovimientoCaja.caja_id == caja_id).order_by(MovimientoCaja.created_at.desc())
    return paginar(db, stmt, page, size)


def get_todos_los_movimientos(db: Session, caja_id: int) -> list[MovimientoCaja]:
    """Trae todos los movimientos de la caja, sin paginar: necesario para calcular el resumen/reconciliación."""
    stmt = select(MovimientoCaja).where(MovimientoCaja.caja_id == caja_id)
    return list(db.scalars(stmt))


def get_movimientos_by_caja_ids(db: Session, caja_ids: list[int]) -> list[MovimientoCaja]:
    """Igual que get_todos_los_movimientos pero para varias cajas a la vez (ver caja_service.resumenes)."""
    stmt = select(MovimientoCaja).where(MovimientoCaja.caja_id.in_(caja_ids))
    return list(db.scalars(stmt))


def crear_movimiento(db: Session, movimiento: MovimientoCaja) -> MovimientoCaja:
    db.add(movimiento)
    db.flush()
    return movimiento
