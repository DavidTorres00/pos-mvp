from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.schemas.caja import CajaResumenOut
from app.schemas.reporte import VentasDiaOut
from app.services import reporte_service
from app.services.reporte_service import SinCajaError

router = APIRouter(prefix="/reportes", tags=["reportes"], dependencies=[Depends(get_current_user)])


@router.get("/ventas-dia", response_model=VentasDiaOut)
def ventas_dia(fecha: date | None = None, db: Session = Depends(get_db)) -> VentasDiaOut:
    return reporte_service.ventas_del_dia(db, fecha)


@router.get("/caja", response_model=CajaResumenOut)
def caja(db: Session = Depends(get_db)) -> CajaResumenOut:
    try:
        return reporte_service.caja_actual_o_ultima(db)
    except SinCajaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aún no hay ninguna caja registrada")
