from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.movimiento_caja import TipoMovimientoCaja


class CajaAbrirRequest(BaseModel):
    equipo_id: int
    monto_inicial: Decimal = Field(ge=0)


class CajaCerrarRequest(BaseModel):
    monto_final: Decimal = Field(ge=0)


class MovimientoCajaCreate(BaseModel):
    tipo: TipoMovimientoCaja
    monto: Decimal = Field(gt=0)
    motivo: str | None = None


class MovimientoCajaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    caja_id: int
    usuario_id: int
    tipo: TipoMovimientoCaja
    monto: Decimal
    motivo: str | None
    created_at: datetime


class CajaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    usuario_id: int
    usuario_nombre: str
    equipo_id: int
    equipo_nombre: str
    monto_inicial: Decimal
    monto_final: Decimal | None
    abierta: bool
    fecha_apertura: datetime
    fecha_cierre: datetime | None


class CajaResumenOut(BaseModel):
    caja: CajaOut
    total_ventas_efectivo: Decimal
    total_ventas_tarjeta: Decimal
    total_ventas_transferencia: Decimal
    total_entradas: Decimal
    total_salidas: Decimal
    monto_esperado: Decimal
    diferencia: Decimal | None


class CajaActualOut(BaseModel):
    caja: CajaOut | None
    efectivo_actual: Decimal | None
    limite_efectivo: Decimal | None
    excede_limite: bool
    ultimo_cierre: datetime | None


class VoucherRetiroOut(BaseModel):
    movimiento_id: int
    caja_id: int
    cajero: str
    fecha: datetime
    monto_retirado: Decimal
    efectivo_anterior: Decimal
    efectivo_resultante: Decimal
    monto_inicial: Decimal
