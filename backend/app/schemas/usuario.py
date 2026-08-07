from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import RolUsuario


class UsuarioCreate(BaseModel):
    email: EmailStr
    nombre: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=72)
    sucursal_id: int


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nombre: str
    role: RolUsuario
    activo: bool
    puede_retirar_excedente: bool
    sucursal_id: int | None
    sucursal_nombre: str | None


class UsuarioPermisosUpdate(BaseModel):
    puede_retirar_excedente: bool


class UsuarioNombreUpdate(BaseModel):
    nombre: str = Field(min_length=1, max_length=255)
