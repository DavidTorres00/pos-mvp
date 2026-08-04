from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario
from app.schemas.pagination import Pagina
from app.schemas.subcategoria import SubcategoriaCreate, SubcategoriaEstado, SubcategoriaOut, SubcategoriaUpdate
from app.services import subcategoria_service
from app.services.subcategoria_service import (
    CategoriaInvalidaError,
    NombreDuplicadoError,
    SubcategoriaNoEncontradaError,
)

router = APIRouter(prefix="/subcategorias", tags=["subcategorias"], dependencies=[Depends(get_current_user)])
solo_admin = Depends(require_role(RolUsuario.ADMIN))


@router.get("", response_model=Pagina[SubcategoriaOut], dependencies=[solo_admin])
def listar(
    categoria_id: int | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[SubcategoriaOut]:
    items, total = subcategoria_service.listar(db, categoria_id, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=SubcategoriaOut, status_code=status.HTTP_201_CREATED, dependencies=[solo_admin])
def crear(payload: SubcategoriaCreate, db: Session = Depends(get_db)) -> SubcategoriaOut:
    try:
        return subcategoria_service.crear(db, payload.categoria_id, payload.nombre)
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")
    except CategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría no existe")


@router.put("/{subcategoria_id}", response_model=SubcategoriaOut, dependencies=[solo_admin])
def actualizar(subcategoria_id: int, payload: SubcategoriaUpdate, db: Session = Depends(get_db)) -> SubcategoriaOut:
    try:
        return subcategoria_service.actualizar(db, subcategoria_id, payload.nombre)
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")
    except SubcategoriaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategoría no encontrada")


@router.patch("/{subcategoria_id}/estado", response_model=SubcategoriaOut, dependencies=[solo_admin])
def cambiar_estado(
    subcategoria_id: int, payload: SubcategoriaEstado, db: Session = Depends(get_db)
) -> SubcategoriaOut:
    try:
        return subcategoria_service.cambiar_estado(db, subcategoria_id, payload.activo)
    except SubcategoriaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Subcategoría no encontrada")
