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
    """Catálogo puro (sin cantidad) — el stock ya no vive en Producto, es por sucursal. Usado tal
    cual para referencias anidadas (item de compra, movimiento, regla/orden de reorden)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    sku: str
    precio_venta: Decimal
    activo: bool
    categoria_id: int | None
    categoria: CategoriaOut | None
    subcategoria_id: int | None
    subcategoria: SubcategoriaOut | None


class ProductoStockOut(ProductoOut):
    """ProductoOut + stock de UNA sucursal específica (la resuelta por resolve_sucursal_id).
    Solo tiene sentido en el listado/detalle de Productos, donde ese contexto existe."""

    stock: int
