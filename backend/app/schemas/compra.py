from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.compra import EstadoCompra
from app.schemas.producto import ProductoOut
from app.schemas.proveedor import ProveedorOut
from app.schemas.sucursal import SucursalOut
from app.schemas.usuario import UsuarioOut


class CompraItemCreate(BaseModel):
    producto_id: int
    cantidad: int = Field(gt=0)
    costo_unitario: Decimal = Field(gt=0)


class CompraCreate(BaseModel):
    proveedor_id: int
    items: list[CompraItemCreate] = Field(min_length=1)


class CompraRecibirItem(BaseModel):
    producto_id: int
    cantidad_recibida: int = Field(ge=0)


class CompraRecibirRequest(BaseModel):
    items: list[CompraRecibirItem] = Field(min_length=1)


class DetalleCompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    producto_id: int
    producto: ProductoOut
    cantidad: int
    costo_unitario: Decimal
    subtotal: Decimal
    cantidad_recibida: int | None


class CompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    proveedor_id: int
    proveedor: ProveedorOut
    sucursal_id: int
    sucursal: SucursalOut
    total: Decimal
    usuario_id: int
    usuario: UsuarioOut
    estado: EstadoCompra
    aprobado_por_id: int | None
    aprobado_por: UsuarioOut | None
    aprobado_at: datetime | None
    openpay_payment_id: str | None
    error: str | None
    recibido_por_id: int | None
    recibido_por: UsuarioOut | None
    recibido_at: datetime | None
    created_at: datetime
    items: list[DetalleCompraOut]
