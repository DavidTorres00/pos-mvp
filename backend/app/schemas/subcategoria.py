from pydantic import BaseModel, ConfigDict

from app.schemas.categoria import CategoriaOut


class SubcategoriaCreate(BaseModel):
    nombre: str
    categoria_id: int


class SubcategoriaUpdate(BaseModel):
    nombre: str


class SubcategoriaEstado(BaseModel):
    activo: bool


class SubcategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    codigo: str
    activo: bool
    categoria_id: int
    categoria: CategoriaOut
