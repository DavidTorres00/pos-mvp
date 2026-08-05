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
    # true si este usuario tiene la caja abierta a su nombre en este momento — computado en
    # usuario_service.listar cruzando contra caja_repository.get_abiertas(); en el resto de los
    # endpoints (login/me/crear/permisos) que devuelven un Usuario "a secas" no aplica, default False
    caja_activa: bool = False


class UsuarioPermisosUpdate(BaseModel):
    puede_retirar_excedente: bool
