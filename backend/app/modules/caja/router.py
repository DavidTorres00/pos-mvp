from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import Usuario
from app.schemas.caja import (
    CajaAbrirRequest,
    CajaCerrarRequest,
    CajaOut,
    CajaResumenOut,
    MovimientoCajaCreate,
    MovimientoCajaOut,
)
from app.schemas.pagination import Pagina
from app.services import caja_service
from app.services.caja_service import CajaNoAbiertaError, CajaNoEncontradaError, CajaYaAbiertaError

router = APIRouter(prefix="/caja", tags=["caja"], dependencies=[Depends(get_current_user)])


@router.get("/actual", response_model=CajaOut | None)
def actual(db: Session = Depends(get_db)) -> CajaOut | None:
    return caja_service.obtener_abierta(db)


@router.post("/abrir", response_model=CajaOut, status_code=status.HTTP_201_CREATED)
def abrir(
    payload: CajaAbrirRequest, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> CajaOut:
    try:
        return caja_service.abrir(db, usuario.id, payload.monto_inicial)
    except CajaYaAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya hay una caja abierta")


@router.post("/cerrar", response_model=CajaResumenOut)
def cerrar(payload: CajaCerrarRequest, db: Session = Depends(get_db)) -> CajaResumenOut:
    try:
        return caja_service.cerrar(db, payload.monto_final)
    except CajaNoAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay caja abierta")


@router.post("/movimientos", response_model=MovimientoCajaOut, status_code=status.HTTP_201_CREATED)
def crear_movimiento(payload: MovimientoCajaCreate, db: Session = Depends(get_db)) -> MovimientoCajaOut:
    try:
        return caja_service.registrar_movimiento(db, payload.tipo, payload.monto, payload.motivo)
    except CajaNoAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay caja abierta")


@router.get("/movimientos", response_model=Pagina[MovimientoCajaOut])
def listar_movimientos(
    caja_id: int,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[MovimientoCajaOut]:
    items, total = caja_service.listar_movimientos(db, caja_id, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.get("/{caja_id}/resumen", response_model=CajaResumenOut)
def resumen(caja_id: int, db: Session = Depends(get_db)) -> CajaResumenOut:
    try:
        return caja_service.resumen(db, caja_id)
    except CajaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caja no encontrada")
