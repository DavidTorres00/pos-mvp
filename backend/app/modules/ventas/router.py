from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import Usuario
from app.schemas.pagination import Pagina
from app.schemas.venta import VentaCreate, VentaOut
from app.services import venta_service
from app.services.venta_service import (
    CajaNoAbiertaError,
    ProductoInvalidoError,
    StockInsuficienteError,
    VentaNoEncontradaError,
)

router = APIRouter(prefix="/ventas", tags=["ventas"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=Pagina[VentaOut])
def listar(
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion), db: Session = Depends(get_db)
) -> Pagina[VentaOut]:
    items, total = venta_service.listar(db, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=VentaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: VentaCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> VentaOut:
    try:
        return venta_service.crear(db, usuario.id, payload.items)
    except CajaNoAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay caja abierta")
    except ProductoInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uno de los productos no es válido")
    except StockInsuficienteError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stock insuficiente para el producto {e.producto_id}"
        )


@router.get("/{venta_id}", response_model=VentaOut)
def obtener(venta_id: int, db: Session = Depends(get_db)) -> VentaOut:
    try:
        return venta_service.obtener(db, venta_id)
    except VentaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
