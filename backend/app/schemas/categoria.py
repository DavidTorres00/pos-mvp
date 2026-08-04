from pydantic import BaseModel, ConfigDict


class CategoriaCreate(BaseModel):
    nombre: str


class CategoriaUpdate(BaseModel):
    nombre: str


class CategoriaEstado(BaseModel):
    activo: bool


class CategoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    codigo: str
    activo: bool
