from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.movimiento_caja import TipoMovimientoCaja


class CajaAbrirRequest(BaseModel):
    monto_inicial: Decimal


class CajaCerrarRequest(BaseModel):
    monto_final: Decimal


class MovimientoCajaCreate(BaseModel):
    tipo: TipoMovimientoCaja
    monto: Decimal
    motivo: str | None = None


class MovimientoCajaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caja_id: int
    tipo: TipoMovimientoCaja
    monto: Decimal
    motivo: str | None
    created_at: datetime


class CajaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    monto_inicial: Decimal
    monto_final: Decimal | None
    abierta: bool
    fecha_apertura: datetime
    fecha_cierre: datetime | None


class CajaResumenOut(BaseModel):
    caja: CajaOut
    total_ventas_efectivo: Decimal
    total_entradas: Decimal
    total_salidas: Decimal
    monto_esperado: Decimal
    diferencia: Decimal | None
