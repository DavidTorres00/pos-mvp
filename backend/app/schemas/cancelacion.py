from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CancelacionCreate(BaseModel):
    motivo: str = Field(min_length=1, max_length=500)


class CancelacionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    venta_id: int
    actor_id: int
    actor_nombre: str
    motivo: str
    monto_total: Decimal
    movimiento_caja_id: int | None
    created_at: datetime
