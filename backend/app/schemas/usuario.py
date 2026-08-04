from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.usuario import RolUsuario


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nombre: str
    role: RolUsuario
    activo: bool
    puede_retirar_excedente: bool


class UsuarioPermisosUpdate(BaseModel):
    puede_retirar_excedente: bool
