from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.schemas.usuario import UsuarioOut


class AuditoriaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int | None
    usuario: UsuarioOut | None
    accion: str
    entidad: str
    entidad_id: int | None
    detalle: dict[str, Any] | None
    created_at: datetime
