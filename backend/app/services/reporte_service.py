from datetime import UTC, date, datetime

from sqlalchemy.orm import Session

from app.repositories import caja_repository, reporte_repository
from app.schemas.caja import CajaResumenOut
from app.schemas.reporte import VentasDiaOut
from app.services import caja_service


class SinCajaError(Exception):
    pass


def ventas_del_dia(db: Session, fecha: date | None = None) -> VentasDiaOut:
    fecha = fecha or datetime.now(UTC).date()
    total, cantidad = reporte_repository.totales_ventas_del_dia(db, fecha)
    return VentasDiaOut(fecha=fecha, total_ventas=total, cantidad_ventas=cantidad)


def caja_actual_o_ultima(db: Session) -> CajaResumenOut:
    caja = caja_repository.get_abierta(db) or caja_repository.get_ultima_cerrada(db)
    if caja is None:
        raise SinCajaError()
    return caja_service.resumen(db, caja.id)
