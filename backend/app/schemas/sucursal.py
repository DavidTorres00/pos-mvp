from pydantic import BaseModel, ConfigDict


class SucursalCreate(BaseModel):
    nombre: str


class SucursalUpdate(BaseModel):
    nombre: str


class SucursalEstado(BaseModel):
    activo: bool


class SucursalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    activo: bool
