from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.venta import EstadoVenta, FormaPago
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
    costo_unitario: Decimal | None
    utilidad: Decimal | None


class VentaResumenOut(BaseModel):
    total_monto: Decimal
    # total_monto - devoluciones_monto del período — el KPI "Ventas" que ve el admin, ver
    # docs/BACKEND.md. Ya excluye ventas canceladas desde la raíz (nunca contaron).
    total_neto: Decimal
    cantidad: int
    total_articulos: int
    utilidad_total: Decimal
    # null si ninguna línea del rango tiene costo cargado — no hay margen que calcular, no un 0%
    margen_pct: Decimal | None
    articulos_con_costo: int
    devoluciones_monto: Decimal
    devoluciones_cantidad: int
    cancelaciones_monto: Decimal
    cancelaciones_cantidad: int


class ProductoVentaOut(BaseModel):
    producto_id: int
    producto_nombre: str
    cantidad: int
    total_vendido: Decimal


class MovimientoReversaOut(BaseModel):
    tipo: Literal["devolucion", "cancelacion"]
    id: int
    venta_id: int
    created_at: datetime
    sucursal_nombre: str | None
    actor_nombre: str
    motivo: str
    monto_total: Decimal


class ProductoReporteOut(BaseModel):
    producto_id: int
    sku: str
    producto_nombre: str
    categoria_nombre: str | None
    cantidad: int
    total_vendido: Decimal
    utilidad_total: Decimal
    margen_pct: Decimal | None


class VentaPorDiaOut(BaseModel):
    fecha: date
    total_monto: Decimal
    cantidad: int


class VentaPorSucursalOut(BaseModel):
    sucursal_id: int
    sucursal_nombre: str
    total_monto: Decimal
    utilidad_total: Decimal
    cantidad: int


class VentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caja_id: int
    usuario_id: int
    usuario_nombre: str
    total: Decimal
    forma_pago: FormaPago
    estado: EstadoVenta
    created_at: datetime
    sucursal_nombre: str
    items: list[DetalleVentaOut]
