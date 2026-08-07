from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.movimiento_caja import TipoMovimientoCaja


class CajaAbrirRequest(BaseModel):
    equipo_id: int
    monto_inicial: Decimal = Field(ge=0)


class CajaCerrarRequest(BaseModel):
    monto_final: Decimal = Field(ge=0)
    # solo obligatorio cuando el cierre resulta en faltante (ver caja_service.cerrar) — un
    # sobrante no exige explicación, no es una pérdida
    motivo_diferencia: str | None = None


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
    sucursal_nombre: str
    sucursal_direccion: str | None
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
    # límite vigente para la sucursal de esta caja (override propio o el default global) — para
    # que cualquier pantalla que liste cajas (Dashboard, Sucursales) compare contra el límite
    # correcto sin tener que resolverlo aparte
    limite_efectivo: Decimal | None


class CajaActualOut(BaseModel):
    caja: CajaOut | None
    efectivo_actual: Decimal | None
    limite_efectivo: Decimal | None
    excede_limite: bool
    ultimo_cierre: datetime | None


class EquipoCajaOut(BaseModel):
    """Estado en vivo de una caja registradora (Equipo) dentro del hub de una sucursal — a
    diferencia de CajaResumenOut, existe una fila por Equipo aunque esté cerrado ahora mismo."""

    equipo_id: int
    equipo_nombre: str
    equipo_activo: bool
    estado: str  # "abierta" | "excedida" | "cerrada"
    cajero_usuario_id: int | None
    cajero_nombre: str | None
    monto_esperado: Decimal | None
    limite_efectivo: Decimal | None
    fecha_apertura: datetime | None
    ultimo_cierre: datetime | None


class VoucherRetiroOut(BaseModel):
    movimiento_id: int
    caja_id: int
    cajero: str
    autorizado_por: str
    sucursal_nombre: str
    sucursal_direccion: str | None
    equipo_nombre: str
    fecha: datetime
    monto_retirado: Decimal
    efectivo_anterior: Decimal
    efectivo_resultante: Decimal
    monto_inicial: Decimal
