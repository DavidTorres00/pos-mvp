from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.caja import EquipoCajaOut
from app.schemas.pagination import Pagina
from app.schemas.sucursal import SucursalCreate, SucursalEstado, SucursalOut, SucursalUpdate
from app.services import caja_service, sucursal_service
from app.services.sucursal_service import NombreDuplicadoError, SucursalNoEncontradaError

router = APIRouter(
    prefix="/sucursales", tags=["sucursales"], dependencies=[Depends(require_role(RolUsuario.ADMIN))]
)


@router.get("", response_model=Pagina[SucursalOut])
def listar(
    q: str | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[SucursalOut]:
    items, total = sucursal_service.listar(db, q, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=SucursalOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: SucursalCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.ADMIN))
) -> SucursalOut:
    try:
        return sucursal_service.crear(
            db, usuario.id, payload.nombre, payload.direccion, payload.responsable, payload.telefono,
            payload.limite_efectivo_caja,
        )
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")


@router.get("/{sucursal_id}", response_model=SucursalOut)
def obtener(sucursal_id: int, db: Session = Depends(get_db)) -> SucursalOut:
    try:
        return sucursal_service.obtener(db, sucursal_id)
    except SucursalNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sucursal no encontrada")


@router.put("/{sucursal_id}", response_model=SucursalOut)
def actualizar(sucursal_id: int, payload: SucursalUpdate, db: Session = Depends(get_db)) -> SucursalOut:
    try:
        return sucursal_service.actualizar(
            db, sucursal_id, payload.nombre, payload.direccion, payload.responsable, payload.telefono,
            payload.limite_efectivo_caja,
        )
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")
    except SucursalNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sucursal no encontrada")


@router.get("/{sucursal_id}/cajas", response_model=list[EquipoCajaOut])
def cajas(sucursal_id: int, db: Session = Depends(get_db)) -> list[EquipoCajaOut]:
    return caja_service.estado_cajas_por_sucursal(db, sucursal_id)


@router.patch("/{sucursal_id}/estado", response_model=SucursalOut)
def cambiar_estado(
    sucursal_id: int,
    payload: SucursalEstado,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> SucursalOut:
    try:
        return sucursal_service.cambiar_estado(db, usuario.id, sucursal_id, payload.activo)
    except SucursalNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sucursal no encontrada")
