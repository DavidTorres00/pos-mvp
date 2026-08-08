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
    puede_hacer_devoluciones: bool
    sucursal_id: int | None
    sucursal_nombre: str | None


class UsuarioPermisosUpdate(BaseModel):
    # ambos opcionales: la UI cambia un permiso a la vez (un switch por fila), no manda el otro
    puede_retirar_excedente: bool | None = None
    puede_hacer_devoluciones: bool | None = None


class UsuarioUpdate(BaseModel):
    # todos opcionales (PATCH parcial, "editar cajero" consolidado) — a diferencia de
    # ConfiguracionNegocioUpdate, acá `None` significa "no tocar este campo", nunca "vaciarlo":
    # nombre/email/sucursal_id son NOT NULL a nivel de modelo (sucursal_id además forzado por
    # CHECK para cajero), no existe un valor "vacío" válido que mandar.
    nombre: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    sucursal_id: int | None = None
    activo: bool | None = None


class UsuarioPasswordUpdate(BaseModel):
    password: str = Field(min_length=8, max_length=72)
