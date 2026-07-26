from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.venta import Venta


def totales_ventas_del_dia(db: Session, fecha: date) -> tuple[Decimal, int]:
    stmt = select(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id)).where(
        func.date(Venta.created_at) == fecha
    )
    total, cantidad = db.execute(stmt).one()
    return Decimal(total), cantidad
