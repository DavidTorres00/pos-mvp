from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role, resolve_sucursal_id
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.movimiento_inventario import TipoMovimiento
from app.models.usuario import RolUsuario, Usuario
from app.schemas.movimiento_inventario import MovimientoCreate, MovimientoOut
from app.schemas.pagination import Pagina
from app.services import inventario_service
from app.services.inventario_service import ProductoNoEncontradoError, StockInsuficienteError

router = APIRouter(prefix="/inventario", tags=["inventario"], dependencies=[Depends(get_current_user)])
solo_admin = Depends(require_role(RolUsuario.ADMIN))


@router.get("/movimientos", response_model=Pagina[MovimientoOut], dependencies=[solo_admin])
def listar_movimientos(
    producto_id: int | None = None,
    q: str | None = None,
    tipo: TipoMovimiento | None = None,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    sucursal_id: int = Depends(resolve_sucursal_id),
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[MovimientoOut]:
    items, total = inventario_service.listar_movimientos(
        db, sucursal_id, producto_id, q, tipo, desde, hasta, paginacion.page, paginacion.size
    )
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post(
    "/movimientos",
    response_model=MovimientoOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[solo_admin],
)
def crear_movimiento(
    payload: MovimientoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    sucursal_id: int = Depends(resolve_sucursal_id),
) -> MovimientoOut:
    try:
        return inventario_service.registrar_movimiento(
            db, usuario.id, payload.producto_id, sucursal_id, payload.tipo, payload.cantidad, payload.motivo
        )
    except ProductoNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    except StockInsuficienteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock insuficiente")
