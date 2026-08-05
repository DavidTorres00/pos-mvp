from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database.session import get_db
from app.models.usuario import RolUsuario
from app.schemas.caja import CajaResumenOut
from app.schemas.reporte import VentasDiaOut
from app.services import reporte_service

router = APIRouter(prefix="/reportes", tags=["reportes"], dependencies=[Depends(require_role(RolUsuario.ADMIN))])


@router.get("/ventas-dia", response_model=VentasDiaOut)
def ventas_dia(fecha: date | None = None, db: Session = Depends(get_db)) -> VentasDiaOut:
    return reporte_service.ventas_del_dia(db, fecha)


@router.get("/cajas-abiertas", response_model=list[CajaResumenOut])
def cajas_abiertas(db: Session = Depends(get_db)) -> list[CajaResumenOut]:
    return reporte_service.cajas_abiertas(db)
