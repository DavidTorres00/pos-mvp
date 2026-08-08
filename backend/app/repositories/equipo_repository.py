from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.repositories.pagination import paginar


def get_all(db: Session, sucursal_id: int | None, page: int, size: int) -> tuple[list[Equipo], int]:
    stmt = select(Equipo).order_by(Equipo.nombre)
    if sucursal_id is not None:
        stmt = stmt.where(Equipo.sucursal_id == sucursal_id)
    return paginar(db, stmt, page, size)


def get_by_id(db: Session, equipo_id: int) -> Equipo | None:
    return db.get(Equipo, equipo_id)


def get_by_nombre(db: Session, sucursal_id: int, nombre: str) -> Equipo | None:
    return db.scalar(select(Equipo).where(Equipo.sucursal_id == sucursal_id, Equipo.nombre == nombre))


def get_activos_by_sucursal(db: Session, sucursal_id: int) -> list[Equipo]:
    stmt = select(Equipo).where(Equipo.sucursal_id == sucursal_id, Equipo.activo.is_(True)).order_by(Equipo.nombre)
    return list(db.scalars(stmt))


def get_todos_by_sucursal(db: Session, sucursal_id: int) -> list[Equipo]:
    """A diferencia de get_activos_by_sucursal, incluye también los inactivos — el hub de
    Sucursales necesita listar todas las cajas configuradas, no solo las disponibles para abrir."""
    stmt = select(Equipo).where(Equipo.sucursal_id == sucursal_id).order_by(Equipo.nombre)
    return list(db.scalars(stmt))


def get_activos(db: Session) -> list[Equipo]:
    """Todos los equipos activos de todas las sucursales — usado por el reporte de resumen
    por sucursal del dashboard admin (§ mapear equipo_id -> sucursal_id sin N+1)."""
    return list(db.scalars(select(Equipo).where(Equipo.activo.is_(True))))


def contar_activos(db: Session) -> int:
    """Total de equipos activos de todas las sucursales — contra esto se compara
    `ConfiguracionNegocio.limite_equipos` (cupo de hardware físico vendido a esta instalación,
    ver equipo_service.crear/cambiar_estado)."""
    return db.scalar(select(func.count()).select_from(Equipo).where(Equipo.activo.is_(True))) or 0


def create(db: Session, equipo: Equipo) -> Equipo:
    db.add(equipo)
    db.flush()
    return equipo


def save(db: Session, equipo: Equipo) -> Equipo:
    db.flush()
    return equipo
