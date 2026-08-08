from datetime import datetime

from pydantic import BaseModel, Field


class PlanOut(BaseModel):
    limite_equipos: int | None
    equipos_activos: int
    updated_at: datetime


class PlanUpdate(BaseModel):
    limite_equipos: int | None = Field(default=None, ge=0)
