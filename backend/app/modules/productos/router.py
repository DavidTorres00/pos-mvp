from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.pagination import Pagina
from app.schemas.producto import ProductoCreate, ProductoEstado, ProductoOut, ProductoUpdate
from app.services import producto_service
from app.services.producto_service import (
    CategoriaInvalidaError,
    ProductoNoEncontradoError,
    SkuDuplicadoError,
    SkuRequeridoError,
    SubcategoriaInvalidaError,
)

router = APIRouter(prefix="/productos", tags=["productos"], dependencies=[Depends(get_current_user)])
solo_admin = Depends(require_role(RolUsuario.ADMIN))


@router.get("", response_model=Pagina[ProductoOut])
def listar(
    q: str | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[ProductoOut]:
    items, total = producto_service.listar(db, q, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED, dependencies=[solo_admin])
def crear(payload: ProductoCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)) -> ProductoOut:
    try:
        return producto_service.crear(
            db,
            usuario.id,
            payload.nombre,
            payload.sku,
            payload.precio_venta,
            payload.categoria_id,
            payload.subcategoria_id,
        )
    except SkuDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU ya está en uso")
    except SkuRequeridoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU es requerido sin subcategoría")
    except CategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría no existe")
    except SubcategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La subcategoría no existe")


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener(producto_id: int, db: Session = Depends(get_db)) -> ProductoOut:
    try:
        return producto_service.obtener(db, producto_id)
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.put("/{producto_id}", response_model=ProductoOut, dependencies=[solo_admin])
def actualizar(
    producto_id: int, payload: ProductoUpdate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> ProductoOut:
    try:
        return producto_service.actualizar(
            db,
            usuario.id,
            producto_id,
            payload.nombre,
            payload.sku,
            payload.precio_venta,
            payload.categoria_id,
            payload.subcategoria_id,
        )
    except SkuDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU ya está en uso")
    except CategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría no existe")
    except SubcategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La subcategoría no existe")
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.patch("/{producto_id}/estado", response_model=ProductoOut, dependencies=[solo_admin])
def cambiar_estado(
    producto_id: int, payload: ProductoEstado, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> ProductoOut:
    try:
        return producto_service.cambiar_estado(db, usuario.id, producto_id, payload.activo)
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
