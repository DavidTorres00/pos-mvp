from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session
from sqlalchemy.sql import Select

from app.models.caja import CajaSesion
from app.models.categoria import Categoria
from app.models.detalle_venta import DetalleVenta
from app.models.equipo import Equipo
from app.models.producto import Producto
from app.models.sucursal import Sucursal
from app.models.venta import EstadoVenta, FormaPago, Venta
from app.repositories.pagination import paginar

T = TypeVar("T")


def _filtrar(
    stmt: Select[T],
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
    excluir_canceladas: bool = False,
) -> Select[T]:
    if desde is not None:
        stmt = stmt.where(Venta.created_at >= desde)
    if hasta is not None:
        # 'hasta' llega como fecha (medianoche); se incluye el día completo, no solo hasta las 00:00
        stmt = stmt.where(Venta.created_at < hasta + timedelta(days=1))
    if forma_pago is not None:
        stmt = stmt.where(Venta.forma_pago == forma_pago)
    if usuario_id is not None:
        stmt = stmt.where(Venta.usuario_id == usuario_id)
    if sucursal_id is not None:
        # Venta no tiene sucursal_id propio (ver docs/BACKEND.md) — se resuelve vía la caja que
        # la originó, mismo join que `reporte_repository.ventas_por_sucursal_del_dia`.
        stmt = (
            stmt.join(CajaSesion, CajaSesion.id == Venta.caja_id)
            .join(Equipo, Equipo.id == CajaSesion.equipo_id)
            .where(Equipo.sucursal_id == sucursal_id)
        )
    if excluir_canceladas:
        # una venta cancelada nunca debió contar — se excluye de todo agregado (resumen, gráficas,
        # ranking de productos), a diferencia del historial (`get_all`), que sí la muestra con su
        # badge de estado. Ver docs/BACKEND.md.
        stmt = stmt.where(Venta.estado != EstadoVenta.CANCELADA)
    return stmt


def get_all(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
    page: int,
    size: int,
) -> tuple[list[Venta], int]:
    stmt = _filtrar(
        select(Venta).order_by(Venta.created_at.desc()), desde, hasta, forma_pago, sucursal_id, usuario_id
    )
    return paginar(db, stmt, page, size)


def resumen(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> tuple[Decimal, int, int, Decimal, Decimal, int]:
    """Total vendido, cantidad de tickets, artículos vendidos, utilidad, ventas con costo
    conocido y artículos con costo conocido, para los mismos filtros que `get_all`, sin paginar
    — alimenta los stat tiles del hub de Ventas (ver docs/FRONTEND.md). Tres queries separadas
    (no un solo join): sumar `Venta.total` contra un join con `DetalleVenta` multiplicaría cada
    total una vez por cada línea de esa venta."""
    stmt_ventas = _filtrar(
        select(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id)),
        desde,
        hasta,
        forma_pago,
        sucursal_id,
        usuario_id,
        excluir_canceladas=True,
    )
    total, cantidad = db.execute(stmt_ventas).one()

    stmt_articulos = _filtrar(
        select(func.coalesce(func.sum(DetalleVenta.cantidad), 0))
        .select_from(Venta)
        .join(DetalleVenta, DetalleVenta.venta_id == Venta.id),
        desde,
        hasta,
        forma_pago,
        sucursal_id,
        usuario_id,
        excluir_canceladas=True,
    )
    articulos = db.scalar(stmt_articulos) or 0

    # solo líneas con costo_unitario conocido — una línea sin costo no aporta ni utilidad ni
    # ventas al denominador del margen, en vez de contarse con utilidad 0 (que subestimaría el
    # margen real)
    stmt_utilidad = _filtrar(
        select(
            func.coalesce(func.sum((DetalleVenta.precio_unitario - DetalleVenta.costo_unitario) * DetalleVenta.cantidad), 0),
            func.coalesce(func.sum(DetalleVenta.subtotal), 0),
            func.coalesce(func.sum(DetalleVenta.cantidad), 0),
        )
        .select_from(Venta)
        .join(DetalleVenta, DetalleVenta.venta_id == Venta.id)
        .where(DetalleVenta.costo_unitario.is_not(None)),
        desde,
        hasta,
        forma_pago,
        sucursal_id,
        usuario_id,
        excluir_canceladas=True,
    )
    utilidad_total, ventas_con_costo, articulos_con_costo = db.execute(stmt_utilidad).one()

    return Decimal(total), cantidad, articulos, Decimal(utilidad_total), Decimal(ventas_con_costo), articulos_con_costo


def ranking_productos(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[int, str, int, Decimal]]:
    """Cantidad y monto vendido por producto, para los mismos filtros que `get_all`/`resumen`,
    de mayor a menor cantidad — `venta_service.mas_vendidos` corta los primeros `limite` de esta
    lista completa para el panel "Más vendidos" del hub de Ventas. Solo incluye productos con al
    menos una venta en el rango filtrado — no es "sin stock"/"stock bajo" (esas alertas ya
    existen en `reporte_service`, esto mide frecuencia de venta, no inventario)."""
    stmt = (
        select(Producto.id, Producto.nombre, func.sum(DetalleVenta.cantidad), func.sum(DetalleVenta.subtotal))
        .select_from(DetalleVenta)
        .join(Venta, Venta.id == DetalleVenta.venta_id)
        .join(Producto, Producto.id == DetalleVenta.producto_id)
        .group_by(Producto.id, Producto.nombre)
        .order_by(func.sum(DetalleVenta.cantidad).desc())
    )
    stmt = _filtrar(stmt, desde, hasta, forma_pago, sucursal_id, usuario_id, excluir_canceladas=True)
    return [(pid, nombre, int(cantidad), Decimal(monto)) for pid, nombre, cantidad, monto in db.execute(stmt).all()]


def reporte_productos(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[int, str, str, str | None, int, Decimal, Decimal, Decimal | None]]:
    """Base del reporte exportable "Productos vendidos" (`docs/REPORTES_EXPORTACION.md`) —
    igual que `ranking_productos` pero sin recorte y con SKU/categoría/utilidad/margen por
    producto, para trabajarlo fuera del sistema (no para la card "Top productos" en pantalla,
    que sigue usando `ranking_productos`). Dos queries agrupadas por producto en vez de una sola
    con `case()`, mismo criterio que `resumen()` arriba: una línea sin `costo_unitario` no debe
    aportar utilidad 0 (subestimaría el margen), así que la utilidad se agrega aparte, solo
    sobre líneas con costo conocido."""
    stmt_cantidades = (
        select(
            Producto.id,
            Producto.sku,
            Producto.nombre,
            Categoria.nombre,
            func.sum(DetalleVenta.cantidad),
            func.sum(DetalleVenta.subtotal),
        )
        .select_from(DetalleVenta)
        .join(Venta, Venta.id == DetalleVenta.venta_id)
        .join(Producto, Producto.id == DetalleVenta.producto_id)
        .outerjoin(Categoria, Categoria.id == Producto.categoria_id)
        .group_by(Producto.id, Producto.sku, Producto.nombre, Categoria.nombre)
        .order_by(func.sum(DetalleVenta.cantidad).desc())
    )
    stmt_cantidades = _filtrar(stmt_cantidades, desde, hasta, forma_pago, sucursal_id, usuario_id, excluir_canceladas=True)
    filas = db.execute(stmt_cantidades).all()

    stmt_utilidad = (
        select(
            Producto.id,
            func.sum((DetalleVenta.precio_unitario - DetalleVenta.costo_unitario) * DetalleVenta.cantidad),
            func.sum(DetalleVenta.subtotal),
        )
        .select_from(DetalleVenta)
        .join(Venta, Venta.id == DetalleVenta.venta_id)
        .join(Producto, Producto.id == DetalleVenta.producto_id)
        .where(DetalleVenta.costo_unitario.is_not(None))
        .group_by(Producto.id)
    )
    stmt_utilidad = _filtrar(stmt_utilidad, desde, hasta, forma_pago, sucursal_id, usuario_id, excluir_canceladas=True)
    utilidad_por_producto = {pid: (Decimal(utilidad), Decimal(monto)) for pid, utilidad, monto in db.execute(stmt_utilidad).all()}

    resultado = []
    for pid, sku, nombre, categoria_nombre, cantidad, monto in filas:
        utilidad, monto_con_costo = utilidad_por_producto.get(pid, (None, None))
        margen_pct = (utilidad / monto_con_costo * 100) if utilidad is not None and monto_con_costo else None
        resultado.append(
            (pid, sku, nombre, categoria_nombre, int(cantidad), Decimal(monto), utilidad or Decimal(0), margen_pct)
        )
    return resultado


def por_sucursal(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    usuario_id: int | None,
) -> list[tuple[int, str, Decimal, Decimal, int]]:
    """Ventas, utilidad y cantidad de tickets por sucursal para el rango filtrado, de mayor a
    menor venta — alimenta el ranking de sucursales del hub de Ventas (solo visible con "Todas
    las sucursales" seleccionada, ver docs/FRONTEND.md). Sin `sucursal_id` como parámetro: es
    precisamente lo que se agrupa. Solo incluye sucursales con al menos una venta en el rango."""
    base = (
        select(Equipo.sucursal_id, Sucursal.nombre)
        .select_from(Venta)
        .join(CajaSesion, CajaSesion.id == Venta.caja_id)
        .join(Equipo, Equipo.id == CajaSesion.equipo_id)
        .join(Sucursal, Sucursal.id == Equipo.sucursal_id)
        .where(Venta.estado != EstadoVenta.CANCELADA)
    )
    if desde is not None:
        base = base.where(Venta.created_at >= desde)
    if hasta is not None:
        base = base.where(Venta.created_at < hasta + timedelta(days=1))
    if forma_pago is not None:
        base = base.where(Venta.forma_pago == forma_pago)
    if usuario_id is not None:
        base = base.where(Venta.usuario_id == usuario_id)

    stmt_totales = (
        base.add_columns(func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id))
        .group_by(Equipo.sucursal_id, Sucursal.nombre)
        .order_by(func.sum(Venta.total).desc())
    )
    filas_totales = db.execute(stmt_totales).all()

    stmt_utilidad = (
        base.join(DetalleVenta, DetalleVenta.venta_id == Venta.id)
        .where(DetalleVenta.costo_unitario.is_not(None))
        .add_columns(
            func.coalesce(func.sum((DetalleVenta.precio_unitario - DetalleVenta.costo_unitario) * DetalleVenta.cantidad), 0)
        )
        .group_by(Equipo.sucursal_id, Sucursal.nombre)
    )
    utilidades = {sid: Decimal(utilidad) for sid, _nombre, utilidad in db.execute(stmt_utilidad).all()}

    return [
        (sid, nombre, Decimal(total), utilidades.get(sid, Decimal("0")), cantidad)
        for sid, nombre, total, cantidad in filas_totales
    ]


def por_dia(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[date, Decimal, int]]:
    """Total vendido y cantidad de tickets por día — alimenta el gráfico "Ventas por día" del
    hub de Ventas. `func.date()` sobre un timestamptz usa el `TimeZone` de la sesión de Postgres
    (America/Mexico_City, ver docs/BACKEND.md "Zona horaria de negocio")."""
    dia = func.date(Venta.created_at)
    stmt = _filtrar(
        select(dia, func.coalesce(func.sum(Venta.total), 0), func.count(Venta.id)).group_by(dia).order_by(dia),
        desde,
        hasta,
        forma_pago,
        sucursal_id,
        usuario_id,
        excluir_canceladas=True,
    )
    return [(dia_, Decimal(total), cantidad) for dia_, total, cantidad in db.execute(stmt).all()]


def get_by_id(db: Session, venta_id: int) -> Venta | None:
    return db.get(Venta, venta_id)


def create(db: Session, venta: Venta) -> Venta:
    db.add(venta)
    db.flush()
    return venta
