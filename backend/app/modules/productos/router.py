from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.schemas.producto import ProductoCreate, ProductoEstado, ProductoOut, ProductoUpdate
from app.services import producto_service
from app.services.producto_service import CategoriaInvalidaError, ProductoNoEncontradoError, SkuDuplicadoError

router = APIRouter(prefix="/productos", tags=["productos"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[ProductoOut])
def listar(q: str | None = None, db: Session = Depends(get_db)) -> list[ProductoOut]:
    return producto_service.listar(db, q)


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def crear(payload: ProductoCreate, db: Session = Depends(get_db)) -> ProductoOut:
    try:
        return producto_service.crear(db, payload.nombre, payload.sku, payload.precio_venta, payload.categoria_id)
    except SkuDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU ya está en uso")
    except CategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría no existe")


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener(producto_id: int, db: Session = Depends(get_db)) -> ProductoOut:
    try:
        return producto_service.obtener(db, producto_id)
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar(producto_id: int, payload: ProductoUpdate, db: Session = Depends(get_db)) -> ProductoOut:
    try:
        return producto_service.actualizar(
            db, producto_id, payload.nombre, payload.sku, payload.precio_venta, payload.categoria_id
        )
    except SkuDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El SKU ya está en uso")
    except CategoriaInvalidaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría no existe")
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")


@router.patch("/{producto_id}/estado", response_model=ProductoOut)
def cambiar_estado(producto_id: int, payload: ProductoEstado, db: Session = Depends(get_db)) -> ProductoOut:
    try:
        return producto_service.cambiar_estado(db, producto_id, payload.activo)
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
