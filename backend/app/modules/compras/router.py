from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.compra import CompraCreate, CompraOut
from app.schemas.pagination import Pagina
from app.services import compra_service
from app.services.compra_service import CompraNoEncontradaError, ProductoInvalidoError, ProveedorInvalidoError

router = APIRouter(prefix="/compras", tags=["compras"], dependencies=[Depends(require_role(RolUsuario.ADMIN))])


@router.get("", response_model=Pagina[CompraOut])
def listar(
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion), db: Session = Depends(get_db)
) -> Pagina[CompraOut]:
    items, total = compra_service.listar(db, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=CompraOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: CompraCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> CompraOut:
    try:
        return compra_service.crear(db, usuario.id, payload.proveedor_id, payload.items)
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
