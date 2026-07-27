from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.categoria import CategoriaOut


class ProductoCreate(BaseModel):
    nombre: str
    sku: str
    precio_venta: Decimal = Field(gt=0)
    categoria_id: int | None = None


class ProductoUpdate(BaseModel):
    nombre: str
    sku: str
    precio_venta: Decimal = Field(gt=0)
    categoria_id: int | None = None


class ProductoEstado(BaseModel):
    activo: bool


class ProductoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    sku: str
    precio_venta: Decimal
    stock: int
    activo: bool
    categoria_id: int | None
    categoria: CategoriaOut | None
