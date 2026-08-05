from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario
from app.schemas.equipo import EquipoCreate, EquipoEstado, EquipoOut, EquipoUpdate
from app.schemas.pagination import Pagina
from app.services import equipo_service
from app.services.equipo_service import EquipoNoEncontradoError, NombreDuplicadoError

router = APIRouter(prefix="/equipos", tags=["equipos"], dependencies=[Depends(require_role(RolUsuario.ADMIN))])


@router.get("", response_model=Pagina[EquipoOut])
def listar(
    sucursal_id: int | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[EquipoOut]:
    items, total = equipo_service.listar(db, sucursal_id, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=EquipoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: EquipoCreate, db: Session = Depends(get_db)) -> EquipoOut:
    try:
        return equipo_service.crear(db, payload.sucursal_id, payload.nombre)
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")


@router.put("/{equipo_id}", response_model=EquipoOut)
def actualizar(equipo_id: int, payload: EquipoUpdate, db: Session = Depends(get_db)) -> EquipoOut:
    try:
        return equipo_service.actualizar(db, equipo_id, payload.nombre)
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")
    except EquipoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado")


@router.patch("/{equipo_id}/estado", response_model=EquipoOut)
def cambiar_estado(equipo_id: int, payload: EquipoEstado, db: Session = Depends(get_db)) -> EquipoOut:
    try:
        return equipo_service.cambiar_estado(db, equipo_id, payload.activo)
    except EquipoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Equipo no encontrado")
