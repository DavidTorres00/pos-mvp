from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.pagination import Pagina
from app.schemas.regla_reorden import (
    ReglaReordenCreate,
    ReglaReordenEstado,
    ReglaReordenOut,
    ReglaReordenUpdate,
)
from app.services import regla_reorden_service
from app.services.regla_reorden_service import (
    ProductoInvalidoError,
    ProveedorInvalidoError,
    ReglaNoEncontradaError,
    ReglaYaExisteError,
)

router = APIRouter(
    prefix="/reglas-reorden", tags=["reglas-reorden"], dependencies=[Depends(require_role(RolUsuario.ADMIN))]
)


@router.get("", response_model=Pagina[ReglaReordenOut])
def listar(
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion), db: Session = Depends(get_db)
) -> Pagina[ReglaReordenOut]:
    items, total = regla_reorden_service.listar(db, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=ReglaReordenOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: ReglaReordenCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> ReglaReordenOut:
    try:
        return regla_reorden_service.crear(
            db,
            usuario.id,
            payload.producto_id,
            payload.proveedor_id,
            payload.umbral_stock,
            payload.cantidad_pedido,
            payload.costo_unitario_estimado,
        )
    except ReglaYaExisteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El producto ya tiene una regla de reorden")
    except ProductoInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El producto no existe")
    except ProveedorInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El proveedor no existe")


@router.put("/{regla_id}", response_model=ReglaReordenOut)
def actualizar(regla_id: int, payload: ReglaReordenUpdate, db: Session = Depends(get_db)) -> ReglaReordenOut:
    try:
        return regla_reorden_service.actualizar(
            db, regla_id, payload.proveedor_id, payload.umbral_stock, payload.cantidad_pedido, payload.costo_unitario_estimado
        )
    except ReglaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regla no encontrada")
    except ProveedorInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El proveedor no existe")


@router.patch("/{regla_id}/estado", response_model=ReglaReordenOut)
def cambiar_estado(
    regla_id: int,
    payload: ReglaReordenEstado,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> ReglaReordenOut:
    try:
        return regla_reorden_service.cambiar_estado(db, usuario.id, regla_id, payload.activo)
    except ReglaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Regla no encontrada")
