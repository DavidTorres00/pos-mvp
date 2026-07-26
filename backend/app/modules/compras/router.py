from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.usuario import Usuario
from app.schemas.compra import CompraCreate, CompraOut
from app.services import compra_service
from app.services.compra_service import CompraNoEncontradaError, ProductoInvalidoError

router = APIRouter(prefix="/compras", tags=["compras"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[CompraOut])
def listar(db: Session = Depends(get_db)) -> list[CompraOut]:
    return compra_service.listar(db)


@router.post("", response_model=CompraOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: CompraCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> CompraOut:
    try:
        return compra_service.crear(db, usuario.id, payload.proveedor, payload.items)
    except ProductoInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uno de los productos no existe")


@router.get("/{compra_id}", response_model=CompraOut)
def obtener(compra_id: int, db: Session = Depends(get_db)) -> CompraOut:
    try:
        return compra_service.obtener(db, compra_id)
    except CompraNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compra no encontrada")
