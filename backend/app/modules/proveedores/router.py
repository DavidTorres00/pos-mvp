from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.pagination import Pagina
from app.schemas.proveedor import ProveedorCreate, ProveedorEstado, ProveedorOut, ProveedorUpdate
from app.services import proveedor_service
from app.services.proveedor_service import NombreDuplicadoError, ProveedorNoEncontradoError

router = APIRouter(
    prefix="/proveedores", tags=["proveedores"], dependencies=[Depends(require_role(RolUsuario.ADMIN))]
)


@router.get("", response_model=Pagina[ProveedorOut])
def listar(
    q: str | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[ProveedorOut]:
    items, total = proveedor_service.listar(db, q, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("", response_model=ProveedorOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: ProveedorCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.ADMIN))
) -> ProveedorOut:
    try:
        return proveedor_service.crear(
            db, usuario.id, payload.nombre, payload.contacto, payload.telefono, payload.email, payload.clabe
        )
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")


@router.get("/{proveedor_id}", response_model=ProveedorOut)
def obtener(proveedor_id: int, db: Session = Depends(get_db)) -> ProveedorOut:
    try:
        return proveedor_service.obtener(db, proveedor_id)
    except ProveedorNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")


@router.put("/{proveedor_id}", response_model=ProveedorOut)
def actualizar(proveedor_id: int, payload: ProveedorUpdate, db: Session = Depends(get_db)) -> ProveedorOut:
    try:
        return proveedor_service.actualizar(
            db, proveedor_id, payload.nombre, payload.contacto, payload.telefono, payload.email, payload.clabe
        )
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")
    except ProveedorNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")


@router.patch("/{proveedor_id}/estado", response_model=ProveedorOut)
def cambiar_estado(
    proveedor_id: int,
    payload: ProveedorEstado,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> ProveedorOut:
    try:
        return proveedor_service.cambiar_estado(db, usuario.id, proveedor_id, payload.activo)
    except ProveedorNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proveedor no encontrado")
