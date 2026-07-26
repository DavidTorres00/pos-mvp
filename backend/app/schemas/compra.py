from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.producto import ProductoOut


class CompraItemCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)
    costo_unitario: Decimal = Field(gt=0)


class CompraCreate(BaseModel):
    proveedor: str
    items: list[CompraItemCreate] = Field(min_length=1)


class DetalleCompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto: ProductoOut
    cantidad: int
    costo_unitario: Decimal
    subtotal: Decimal


class CompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proveedor: str
    total: Decimal
    usuario_id: int
    created_at: datetime
    items: list[DetalleCompraOut]
