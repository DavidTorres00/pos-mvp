from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class VentasDiaOut(BaseModel):
    fecha: date
    total_ventas: Decimal
    cantidad_ventas: int


class VentasPorHoraItem(BaseModel):
    hora: int
    total_ventas: Decimal
    cantidad_ventas: int


class AlertaOut(BaseModel):
    """Item del feed 'Requiere tu atención' del dashboard admin — heterogéneo a propósito (cada
    `tipo` representa una alerta de negocio distinta, con su propio texto ya compuesto en el
    backend, no una fila de una tabla). `sucursal_nombre=None` significa 'todas las sucursales'
    (p. ej. el agregado de órdenes de reorden pendientes, que puede abarcar varias)."""

    tipo: str
    titulo: str
    descripcion: str
    sucursal_nombre: str | None
    cantidad: int
    # nulo cuando la alerta no tiene un instante puntual real que mostrar (p. ej. stock bajo:
    # es un corte del inventario ahora mismo, no un evento con fecha) — no se inventa una fecha
    created_at: datetime | None
    # identifican el destino exacto para que el frontend navegue directo a la fila concreta (no
    # solo a la página general) y la resalte — nulos en las alertas que son un agregado sin una
    # sola fila a la que apuntar (p. ej. órdenes de reorden pendientes, que abarcan varias)
    sucursal_id: int | None
    equipo_id: int | None
    auditoria_id: int | None


class AcuseAlertaRequest(BaseModel):
    tipo: str
    referencia_id: int


class SucursalResumenOut(BaseModel):
    sucursal_id: int
    sucursal_nombre: str
    ventas_hoy: Decimal
    cantidad_ventas_hoy: int
    efectivo_esperado: Decimal
    cajas_abiertas: int
    equipos_activos: int
    cajas_excedidas: int
