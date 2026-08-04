from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.categoria import CategoriaOut
from app.schemas.subcategoria import SubcategoriaOut


class ProductoCreate(BaseModel):
    nombre: str
    sku: str | None = None
    precio_venta: Decimal = Field(gt=0)
    categoria_id: int | None = None
    subcategoria_id: int | None = None


class ProductoUpdate(BaseModel):
    nombre: str
    sku: str
    precio_venta: Decimal = Field(gt=0)
    categoria_id: int | None = None
    subcategoria_id: int | None = None


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
    subcategoria_id: int | None
    subcategoria: SubcategoriaOut | None
