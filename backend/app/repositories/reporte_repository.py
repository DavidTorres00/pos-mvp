from datetime import date
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.equipo import Equipo
from app.models.producto import Producto
from app.models.regla_reorden import ReglaReorden
from app.models.stock_sucursal import StockSucursal
from app.models.venta import Venta


def totales_ventas_del_dia(db: Session, fecha: date) -> tuple[Decimal, int]:
    stmt = select(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id)).where(
        func.date(Venta.created_at) == fecha
    )
    total, cantidad = db.execute(stmt).one()
    return Decimal(total), cantidad


def ventas_por_hora(db: Session, fecha: date) -> list[tuple[int, Decimal, int]]:
    hora = func.extract("hour", Venta.created_at)
    stmt = (
        select(hora, func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id))
        .where(func.date(Venta.created_at) == fecha)
        .group_by(hora)
        .order_by(hora)
    )
    return [(int(h), Decimal(total), cantidad) for h, total, cantidad in db.execute(stmt).all()]


def ventas_por_sucursal_del_dia(db: Session, fecha: date) -> dict[int, tuple[Decimal, int]]:
    """Todas las ventas de hoy por sucursal, sin importar si la caja que las originó sigue
    abierta o ya cerró — a diferencia de `caja_service.resumenes` (que solo ve cajas
    actualmente abiertas), esto es para el total de ventas del día por sucursal."""
    stmt = (
        select(Equipo.sucursal_id, func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id))
        .select_from(Venta)
        .join(CajaSesion, CajaSesion.id == Venta.caja_id)
        .join(Equipo, Equipo.id == CajaSesion.equipo_id)
        .where(func.date(Venta.created_at) == fecha)
        .group_by(Equipo.sucursal_id)
    )
    return {sucursal_id: (Decimal(total), cantidad) for sucursal_id, total, cantidad in db.execute(stmt).all()}


def productos_bajo_umbral_sin_regla(db: Session, umbral: int) -> list[tuple[Producto, StockSucursal]]:
    """Productos activos con stock en o debajo de `umbral` EN UNA SUCURSAL donde no hay ninguna
    ReglaReorden activa para ese producto×sucursal — sin regla, esa caída de stock nunca genera
    una OrdenReorden sugerida (`reorden_service.disparar_si_corresponde`), así que el admin no se
    entera si no se lo decimos aquí."""
    stmt = (
        select(Producto, StockSucursal)
        .join(StockSucursal, StockSucursal.producto_id == Producto.id)
        .outerjoin(
            ReglaReorden,
            (ReglaReorden.producto_id == StockSucursal.producto_id)
            & (ReglaReorden.sucursal_id == StockSucursal.sucursal_id),
        )
        .where(
            Producto.activo.is_(True),
            StockSucursal.cantidad <= umbral,
            or_(ReglaReorden.id.is_(None), ReglaReorden.activo.is_(False)),
        )
        .order_by(StockSucursal.cantidad)
    )
    return list(db.execute(stmt).all())


def total_productos_activos(db: Session) -> int:
    return db.scalar(select(func.count(Producto.id)).where(Producto.activo.is_(True))) or 0


def conteo_con_stock_por_sucursal(db: Session) -> dict[int, int]:
    """Por sucursal, cuántos productos activos tienen stock positivo registrado — join normal
    (no cross join) contra StockSucursal. `reporte_service._alertas_sin_stock` resta este
    conteo contra `total_productos_activos` para saber cuántos productos NO tienen stock en cada
    sucursal, incluyendo las que no tienen ninguna fila de `StockSucursal` todavía (sucursal
    recién creada, sin ningún movimiento de inventario) — sin necesidad de generar el producto
    cartesiano Producto×Sucursal para llegar a ese número."""
    stmt = (
        select(StockSucursal.sucursal_id, func.count(func.distinct(StockSucursal.producto_id)))
        .join(Producto, Producto.id == StockSucursal.producto_id)
        .where(Producto.activo.is_(True), StockSucursal.cantidad > 0)
        .group_by(StockSucursal.sucursal_id)
    )
    return dict(db.execute(stmt).all())
