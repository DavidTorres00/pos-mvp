from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role, resolve_sucursal_id
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.compra import CompraCreate, CompraOut, CompraRecibirRequest
from app.schemas.pagination import Pagina
from app.services import compra_service
from app.services.compra_service import (
    CompraNoEncontradaError,
    CompraNoPagadaError,
    CompraNoPendienteError,
    DetalleIncompletoError,
    ProductoInvalidoError,
    ProveedorInvalidoError,
    ProveedorSinDatosPagoError,
)

router = APIRouter(prefix="/compras", tags=["compras"], dependencies=[Depends(require_role(RolUsuario.ADMIN))])


@router.get("", response_model=Pagina[CompraOut])
def listar(
    proveedor_id: int | None = None,
    sucursal_id: int = Depends(resolve_sucursal_id),
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[CompraOut]:
    items, total = compra_service.listar(db, sucursal_id, proveedor_id, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=CompraOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: CompraCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    sucursal_id: int = Depends(resolve_sucursal_id),
) -> CompraOut:
    try:
        return compra_service.crear(db, usuario.id, payload.proveedor_id, sucursal_id, payload.items)
    except ProductoInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uno de los productos no existe")
    except ProveedorInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El proveedor no existe")


@router.get("/{compra_id}", response_model=CompraOut)
def obtener(compra_id: int, db: Session = Depends(get_db)) -> CompraOut:
    try:
        return compra_service.obtener(db, compra_id)
    except CompraNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada")


@router.post("/{compra_id}/aprobar", response_model=CompraOut)
def aprobar(
    compra_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.ADMIN))
) -> CompraOut:
    try:
        return compra_service.aprobar_y_pagar(db, usuario.id, compra_id)
    except CompraNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada")
    except CompraNoPendienteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El pedido ya no está pendiente")
    except ProveedorSinDatosPagoError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="El proveedor no tiene CLABE registrada para pagarle"
        )


@router.post("/{compra_id}/rechazar", response_model=CompraOut)
def rechazar(
    compra_id: int, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.ADMIN))
) -> CompraOut:
    try:
        return compra_service.rechazar(db, usuario.id, compra_id)
    except CompraNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada")
    except CompraNoPendienteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El pedido ya no está pendiente")


@router.post("/{compra_id}/recibir", response_model=CompraOut)
def recibir(
    compra_id: int,
    payload: CompraRecibirRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> CompraOut:
    try:
        return compra_service.recibir(db, usuario.id, compra_id, payload.items)
    except CompraNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada")
    except CompraNoPagadaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El pedido todavía no está pagado")
    except DetalleIncompletoError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Falta indicar la cantidad recibida de algún producto"
        )
