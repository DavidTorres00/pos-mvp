from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role, resolve_sucursal_id
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.orden_reorden import EstadoOrdenReorden
from app.models.usuario import RolUsuario, Usuario
from app.schemas.orden_reorden import OrdenReordenOut
from app.schemas.pagination import Pagina
from app.services import pago_proveedor_service, reorden_service
from app.services.pago_proveedor_service import ProveedorSinDatosPagoError, TopeGastoExcedidoError
from app.services.reorden_service import OrdenNoEncontradaError, OrdenNoPendienteError

router = APIRouter(
    prefix="/ordenes-reorden", tags=["ordenes-reorden"], dependencies=[Depends(require_role(RolUsuario.ADMIN))]
)


@router.get("", response_model=Pagina[OrdenReordenOut])
def listar(
    estado: EstadoOrdenReorden | None = None,
    sucursal_id: int = Depends(resolve_sucursal_id),
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[OrdenReordenOut]:
    items, total = reorden_service.listar(db, sucursal_id, estado, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("/{orden_id}/rechazar", response_model=OrdenReordenOut)
def rechazar(
    orden_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.ADMIN))
) -> OrdenReordenOut:
    try:
        return reorden_service.rechazar(db, usuario.id, orden_id)
    except OrdenNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    except OrdenNoPendienteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La orden ya no está pendiente")


@router.post("/{orden_id}/aprobar", response_model=OrdenReordenOut)
def aprobar(
    orden_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.ADMIN))
) -> OrdenReordenOut:
    try:
        return pago_proveedor_service.aprobar_y_pagar(db, usuario, orden_id)
    except OrdenNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Orden no encontrada")
    except OrdenNoPendienteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La orden ya no está pendiente")
    except TopeGastoExcedidoError as exc:
        detalle = "Supera el tope de gasto por orden" if exc.tipo == "orden" else "Supera el tope de gasto diario"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detalle)
    except ProveedorSinDatosPagoError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El proveedor no tiene CLABE registrada para pagarle"
        )
