from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SucursalCreate(BaseModel):
    nombre: str
    direccion: str | None = None
    responsable: str | None = None
    telefono: str | None = None
    limite_efectivo_caja: Decimal | None = Field(default=None, ge=0)


class SucursalUpdate(BaseModel):
    nombre: str
    direccion: str | None = None
    responsable: str | None = None
    telefono: str | None = None
    limite_efectivo_caja: Decimal | None = Field(default=None, ge=0)


class SucursalEstado(BaseModel):
    activo: bool


class SucursalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    direccion: str | None
    responsable: str | None
    telefono: str | None
    limite_efectivo_caja: Decimal | None
    activo: bool
