from datetime import UTC, date, datetime

from sqlalchemy.orm import Session

from app.repositories import caja_repository, reporte_repository
from app.schemas.caja import CajaResumenOut
from app.schemas.reporte import VentasDiaOut
from app.services import caja_service


def ventas_del_dia(db: Session, fecha: date | None = None) -> VentasDiaOut:
    fecha = fecha or datetime.now(UTC).date()
    total, cantidad = reporte_repository.totales_ventas_del_dia(db, fecha)
    return VentasDiaOut(fecha=fecha, total_ventas=total, cantidad_ventas=cantidad)


def cajas_abiertas(db: Session) -> list[CajaResumenOut]:
    return caja_service.resumenes(db, caja_repository.get_abiertas(db))
