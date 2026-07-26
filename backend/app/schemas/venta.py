from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.producto import ProductoOut


class VentaItemCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)


class VentaCreate(BaseModel):
    items: list[VentaItemCreate] = Field(min_length=1)


class DetalleVentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto: ProductoOut
    cantidad: int
    precio_unitario: Decimal
    subtotal: Decimal


class VentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caja_id: int
    usuario_id: int
    total: Decimal
    created_at: datetime
    items: list[DetalleVentaOut]
