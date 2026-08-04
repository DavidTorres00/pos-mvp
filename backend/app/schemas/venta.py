from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.venta import FormaPago
from app.schemas.producto import ProductoOut


class VentaItemCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)


class VentaCreate(BaseModel):
    items: list[VentaItemCreate] = Field(min_length=1)
    forma_pago: FormaPago = FormaPago.EFECTIVO


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
    forma_pago: FormaPago
    created_at: datetime
    items: list[DetalleVentaOut]
