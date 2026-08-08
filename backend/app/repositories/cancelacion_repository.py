from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.cancelacion import Cancelacion
from app.models.caja import CajaSesion
from app.models.equipo import Equipo
from app.models.venta import FormaPago, Venta


def get_by_venta(db: Session, venta_id: int) -> Cancelacion | None:
    stmt = select(Cancelacion).where(Cancelacion.venta_id == venta_id)
    return db.scalars(stmt).first()


def create(db: Session, cancelacion: Cancelacion) -> Cancelacion:
    db.add(cancelacion)
    db.flush()
    return cancelacion


def resumen(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> tuple[Decimal, int]:
    """Monto total y cantidad de cancelaciones cuyo propio `created_at` cae en el rango — no el
    de la venta original, que puede ser de días antes dentro de la ventana de 24h. Mismo criterio
    de bucketing por fecha de acción que `devolucion_repository.resumen`."""
    stmt = select(func.coalesce(func.sum(Cancelacion.monto_total), 0), func.count(Cancelacion.id)).select_from(
        Cancelacion
    )
    stmt = stmt.join(Venta, Venta.id == Cancelacion.venta_id)
    if desde is not None:
        stmt = stmt.where(Cancelacion.created_at >= desde)
    if hasta is not None:
        stmt = stmt.where(Cancelacion.created_at < hasta + timedelta(days=1))
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
