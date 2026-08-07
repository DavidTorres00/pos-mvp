from sqlalchemy import case, func, or_, select
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.models.stock_sucursal import StockSucursal


def get_all(
    db: Session,
    q: str | None,
    activo: bool | None,
    categoria_id: int | None,
    proveedor_id: int | None,
    sucursal_id: int,
    umbral_stock_bajo: int | None,
    page: int,
    size: int,
) -> tuple[list[tuple[Producto, int | None]], int]:
    """Trae el stock de la sucursal en la misma consulta (join, no una aparte) para poder
    ordenar por alerta sin una segunda vuelta a la base — tres niveles, más urgente primero:
    sin stock (cantidad en 0 o sin fila para esa sucursal), stock bajo (cantidad <= umbral, si
    hay uno configurado), normal. Mismo criterio que reporte_service — alfabético dentro de
    cada nivel."""
    stmt = select(Producto, StockSucursal.cantidad).outerjoin(
        StockSucursal,
        (StockSucursal.producto_id == Producto.id) & (StockSucursal.sucursal_id == sucursal_id),
    )
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(or_(Producto.nombre.ilike(pattern), Producto.sku.ilike(pattern)))
    if activo is not None:
        stmt = stmt.where(Producto.activo == activo)
    if categoria_id is not None:
        stmt = stmt.where(Producto.categoria_id == categoria_id)
    if proveedor_id is not None:
        stmt = stmt.where(Producto.proveedor_id == proveedor_id)

    sin_stock = or_(StockSucursal.cantidad.is_(None), StockSucursal.cantidad <= 0)
    if umbral_stock_bajo is not None:
        orden_alerta = case((sin_stock, 0), (StockSucursal.cantidad <= umbral_stock_bajo, 1), else_=2)
    else:
        orden_alerta = case((sin_stock, 0), else_=2)
    stmt = stmt.order_by(orden_alerta, Producto.nombre)

    # paginar() (repositories/pagination.py) usa db.scalars(), que descarta toda columna aparte
    # de la primera — aquí la consulta trae dos (Producto, cantidad), así que pagina aparte.
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    filas = db.execute(stmt.offset((page - 1) * size).limit(size)).all()
    return [(producto, cantidad) for producto, cantidad in filas], total


def get_by_id(db: Session, producto_id: int) -> Producto | None:
    return db.get(Producto, producto_id)


def get_by_id_for_update(db: Session, producto_id: int) -> Producto | None:
    stmt = select(Producto).where(Producto.id == producto_id).with_for_update(of=Producto)
    return db.scalar(stmt)


def get_by_sku(db: Session, sku: str) -> Producto | None:
    return db.scalar(select(Producto).where(Producto.sku == sku))


def get_skus_con_prefijo(db: Session, prefijo: str) -> list[str]:
    return list(db.scalars(select(Producto.sku).where(Producto.sku.like(f"{prefijo}%"))))


def create(db: Session, producto: Producto) -> Producto:
    db.add(producto)
    db.flush()
    return producto


def save(db: Session, producto: Producto) -> Producto:
    db.flush()
    return producto
