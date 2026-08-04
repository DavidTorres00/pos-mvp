from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.producto import ProductoOut
from app.schemas.proveedor import ProveedorOut


class ReglaReordenCreate(BaseModel):
    producto_id: int
    proveedor_id: int
    umbral_stock: int = Field(ge=0)
    cantidad_pedido: int = Field(gt=0)
    costo_unitario_estimado: Decimal = Field(gt=0)


class ReglaReordenUpdate(BaseModel):
    proveedor_id: int
    umbral_stock: int = Field(ge=0)
    cantidad_pedido: int = Field(gt=0)
    costo_unitario_estimado: Decimal = Field(gt=0)


class ReglaReordenEstado(BaseModel):
    activo: bool


class ReglaReordenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto: ProductoOut
    proveedor_id: int
    proveedor: ProveedorOut
    umbral_stock: int
    cantidad_pedido: int
    costo_unitario_estimado: Decimal
    activo: bool
    created_at: datetime
