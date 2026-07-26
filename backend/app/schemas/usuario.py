from pydantic import BaseModel, ConfigDict, EmailStr


class UsuarioOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    nombre: str
    activo: bool
