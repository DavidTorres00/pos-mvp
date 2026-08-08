from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class DevolucionItemCreate(BaseModel):
    detalle_venta_id: int
    cantidad: int = Field(gt=0)


class DevolucionCreate(BaseModel):
    items: list[DevolucionItemCreate] = Field(min_length=1)
    motivo: str = Field(min_length=1, max_length=500)


class DetalleDevolucionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    detalle_venta_id: int
    producto_id: int
    producto_nombre: str
    cantidad: int
    subtotal: Decimal


class DevolucionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    venta_id: int
    actor_id: int
    actor_nombre: str
    motivo: str
    monto_total: Decimal
    movimiento_caja_id: int | None
    created_at: datetime
    items: list[DetalleDevolucionOut]
