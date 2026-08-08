from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.devolucion import DetalleDevolucion, Devolucion
from app.models.equipo import Equipo
from app.models.sucursal import Sucursal
from app.models.usuario import Usuario
from app.models.venta import FormaPago, Venta


def get_cantidad_devuelta(db: Session, detalle_venta_id: int) -> int:
    """Suma de lo ya devuelto para esa línea de venta, a través de todas sus devoluciones
    previas — evita que se pueda devolver dos veces la misma unidad."""
    stmt = select(func.coalesce(func.sum(DetalleDevolucion.cantidad), 0)).where(
        DetalleDevolucion.detalle_venta_id == detalle_venta_id
    )
    return db.scalar(stmt) or 0


def get_by_venta(db: Session, venta_id: int) -> list[Devolucion]:
    stmt = select(Devolucion).where(Devolucion.venta_id == venta_id).order_by(Devolucion.created_at.desc())
    return list(db.scalars(stmt))


def create(db: Session, devolucion: Devolucion) -> Devolucion:
    db.add(devolucion)
    db.flush()
    return devolucion


def resumen(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> tuple[Decimal, int]:
    """Monto total y cantidad de devoluciones cuyo propio `created_at` cae en el rango — no el
    de la venta original, que puede ser de días antes dentro de la ventana de 24h. Bucketing por
    fecha de acción, igual que el efecto en caja (el reverso de efectivo ocurre al momento de la
    devolución, no de la venta)."""
    stmt = select(func.coalesce(func.sum(Devolucion.monto_total), 0), func.count(Devolucion.id)).select_from(
        Devolucion
    )
    stmt = stmt.join(Venta, Venta.id == Devolucion.venta_id)
    if desde is not None:
        stmt = stmt.where(Devolucion.created_at >= desde)
    if hasta is not None:
        stmt = stmt.where(Devolucion.created_at < hasta + timedelta(days=1))
    if forma_pago is not None:
        stmt = stmt.where(Venta.forma_pago == forma_pago)
    if usuario_id is not None:
        stmt = stmt.where(Venta.usuario_id == usuario_id)
    if sucursal_id is not None:
        stmt = (
            stmt.join(CajaSesion, CajaSesion.id == Venta.caja_id)
            .join(Equipo, Equipo.id == CajaSesion.equipo_id)
            .where(Equipo.sucursal_id == sucursal_id)
        )
    monto_total, cantidad = db.execute(stmt).one()
    return Decimal(monto_total), cantidad


def listar_periodo(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[int, int, datetime, str | None, str, str, Decimal]]:
    """(id, venta_id, created_at, sucursal_nombre, actor_nombre, motivo, monto_total) — base del
    reporte exportable "Devoluciones y cancelaciones" (`docs/REPORTES_EXPORTACION.md`), mismos
    filtros y bucketing por fecha de la propia devolución que `resumen()` arriba."""
    stmt = (
        select(
            Devolucion.id,
            Devolucion.venta_id,
            Devolucion.created_at,
            Sucursal.nombre,
            Usuario.nombre,
            Devolucion.motivo,
            Devolucion.monto_total,
        )
        .select_from(Devolucion)
        .join(Usuario, Usuario.id == Devolucion.actor_id)
        .join(Venta, Venta.id == Devolucion.venta_id)
        .join(CajaSesion, CajaSesion.id == Venta.caja_id)
        .join(Equipo, Equipo.id == CajaSesion.equipo_id)
        .join(Sucursal, Sucursal.id == Equipo.sucursal_id)
    )
    if desde is not None:
        stmt = stmt.where(Devolucion.created_at >= desde)
    if hasta is not None:
        stmt = stmt.where(Devolucion.created_at < hasta + timedelta(days=1))
    if forma_pago is not None:
        stmt = stmt.where(Venta.forma_pago == forma_pago)
    if usuario_id is not None:
        stmt = stmt.where(Venta.usuario_id == usuario_id)
    if sucursal_id is not None:
        stmt = stmt.where(Equipo.sucursal_id == sucursal_id)
    stmt = stmt.order_by(Devolucion.created_at.desc())
    return [tuple(row) for row in db.execute(stmt).all()]
