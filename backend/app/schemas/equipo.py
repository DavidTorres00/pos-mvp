from pydantic import BaseModel, ConfigDict

from app.schemas.sucursal import SucursalOut


class EquipoCreate(BaseModel):
    nombre: str
    sucursal_id: int


class EquipoUpdate(BaseModel):
    nombre: str


class EquipoEstado(BaseModel):
    activo: bool


class EquipoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    activo: bool
    sucursal_id: int
    sucursal: SucursalOut
