from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.compra import Compra, EstadoCompra
from app.models.producto import Producto
from app.models.proveedor import Proveedor
from app.repositories.pagination import paginar


def get_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Proveedor], int]:
    stmt = select(Proveedor).order_by(Proveedor.nombre)
    if q:
        stmt = stmt.where(Proveedor.nombre.ilike(f"%{q}%"))
    return paginar(db, stmt, page, size)


def get_conteos(db: Session, proveedor_ids: list[int]) -> dict[int, tuple[int, int]]:
    """(productos activos que le compra, pedidos pendientes de aprobar) por proveedor — dos
    `GROUP BY`, mismo idioma que `categoria_repository.get_conteos`."""
    if not proveedor_ids:
        return {}
    productos = dict(
        db.execute(
            select(Producto.proveedor_id, func.count(Producto.id))
            .where(Producto.proveedor_id.in_(proveedor_ids), Producto.activo.is_(True))
            .group_by(Producto.proveedor_id)
        ).all()
    )
    pendientes = dict(
        db.execute(
            select(Compra.proveedor_id, func.count(Compra.id))
            .where(Compra.proveedor_id.in_(proveedor_ids), Compra.estado == EstadoCompra.PENDIENTE)
            .group_by(Compra.proveedor_id)
        ).all()
    )
    return {pid: (productos.get(pid, 0), pendientes.get(pid, 0)) for pid in proveedor_ids}


def get_by_id(db: Session, proveedor_id: int) -> Proveedor | None:
    return db.get(Proveedor, proveedor_id)


def get_by_nombre(db: Session, nombre: str) -> Proveedor | None:
    return db.scalar(select(Proveedor).where(Proveedor.nombre == nombre))


def create(db: Session, proveedor: Proveedor) -> Proveedor:
    db.add(proveedor)
    db.flush()
    return proveedor


def save(db: Session, proveedor: Proveedor) -> Proveedor:
    db.flush()
    return proveedor
