from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.caja import CajaResumenOut
from app.schemas.reporte import AcuseAlertaRequest, AlertaOut, SucursalResumenOut, VentasDiaOut, VentasPorHoraItem
from app.services import reporte_service
from app.services.reporte_service import TipoAlertaNoAcusableError

router = APIRouter(prefix="/reportes", tags=["reportes"], dependencies=[Depends(require_role(RolUsuario.ADMIN))])


@router.get("/ventas-dia", response_model=VentasDiaOut)
def ventas_dia(fecha: date | None = None, db: Session = Depends(get_db)) -> VentasDiaOut:
    return reporte_service.ventas_del_dia(db, fecha)


@router.get("/ventas-por-hora", response_model=list[VentasPorHoraItem])
def ventas_por_hora(fecha: date | None = None, db: Session = Depends(get_db)) -> list[VentasPorHoraItem]:
    return reporte_service.ventas_por_hora(db, fecha)


@router.get("/cajas-abiertas", response_model=list[CajaResumenOut])
def cajas_abiertas(db: Session = Depends(get_db)) -> list[CajaResumenOut]:
    return reporte_service.cajas_abiertas(db)


@router.get("/resumen-sucursales", response_model=list[SucursalResumenOut])
def resumen_sucursales(db: Session = Depends(get_db)) -> list[SucursalResumenOut]:
    return reporte_service.resumen_sucursales(db)


@router.get("/atencion", response_model=list[AlertaOut])
def atencion(db: Session = Depends(get_db)) -> list[AlertaOut]:
    return reporte_service.atencion(db)


@router.post("/atencion/acuse", status_code=status.HTTP_204_NO_CONTENT)
def acusar_alerta(
    payload: AcuseAlertaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> None:
    try:
        reporte_service.acusar_alerta(db, usuario.id, payload.tipo, payload.referencia_id)
    except TipoAlertaNoAcusableError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Este tipo de alerta no se puede marcar como revisada"
        )
