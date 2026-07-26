from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.schemas.categoria import CategoriaCreate, CategoriaEstado, CategoriaOut, CategoriaUpdate
from app.services import categoria_service
from app.services.categoria_service import CategoriaNoEncontradaError, NombreDuplicadoError

router = APIRouter(prefix="/categorias", tags=["categorias"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=list[CategoriaOut])
def listar(q: str | None = None, db: Session = Depends(get_db)) -> list[CategoriaOut]:
    return categoria_service.listar(db, q)


@router.post("", response_model=CategoriaOut, status_code=status.HTTP_201_CREATED)
def crear(payload: CategoriaCreate, db: Session = Depends(get_db)) -> CategoriaOut:
    try:
        return categoria_service.crear(db, payload.nombre)
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")


@router.get("/{categoria_id}", response_model=CategoriaOut)
def obtener(categoria_id: int, db: Session = Depends(get_db)) -> CategoriaOut:
    try:
        return categoria_service.obtener(db, categoria_id)
    except CategoriaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")


@router.put("/{categoria_id}", response_model=CategoriaOut)
def actualizar(categoria_id: int, payload: CategoriaUpdate, db: Session = Depends(get_db)) -> CategoriaOut:
    try:
        return categoria_service.actualizar(db, categoria_id, payload.nombre)
    except NombreDuplicadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El nombre ya está en uso")
    except CategoriaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")


@router.patch("/{categoria_id}/estado", response_model=CategoriaOut)
def cambiar_estado(categoria_id: int, payload: CategoriaEstado, db: Session = Depends(get_db)) -> CategoriaOut:
    try:
        return categoria_service.cambiar_estado(db, categoria_id, payload.activo)
    except CategoriaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
