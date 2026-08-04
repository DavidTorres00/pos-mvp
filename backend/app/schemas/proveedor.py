from pydantic import BaseModel, ConfigDict


class ProveedorCreate(BaseModel):
    nombre: str
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    clabe: str | None = None


class ProveedorUpdate(BaseModel):
    nombre: str
    contacto: str | None = None
    telefono: str | None = None
    email: str | None = None
    clabe: str | None = None


class ProveedorEstado(BaseModel):
    activo: bool


class ProveedorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    contacto: str | None
    telefono: str | None
    email: str | None
    clabe: str | None
    activo: bool
