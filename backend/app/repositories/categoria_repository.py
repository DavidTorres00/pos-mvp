from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.categoria import Categoria
from app.models.producto import Producto
from app.models.subcategoria import Subcategoria
from app.repositories.pagination import paginar


def get_all(db: Session, q: str | None, page: int, size: int) -> tuple[list[Categoria], int]:
    stmt = select(Categoria).order_by(Categoria.nombre)
    if q:
        stmt = stmt.where(Categoria.nombre.ilike(f"%{q}%"))
    return paginar(db, stmt, page, size)


def get_conteos(db: Session, categoria_ids: list[int]) -> dict[int, tuple[int, int]]:
    """(subcategorías, productos activos) por categoría — dos `GROUP BY` en vez de una consulta
    por categoría, mismo idioma que los mapas de `reporte_service.resumen_sucursales`."""
    if not categoria_ids:
        return {}
    subcategorias = dict(
        db.execute(
            select(Subcategoria.categoria_id, func.count(Subcategoria.id))
            .where(Subcategoria.categoria_id.in_(categoria_ids))
            .group_by(Subcategoria.categoria_id)
        ).all()
    )
    productos = dict(
        db.execute(
            select(Producto.categoria_id, func.count(Producto.id))
            .where(Producto.categoria_id.in_(categoria_ids), Producto.activo.is_(True))
            .group_by(Producto.categoria_id)
        ).all()
    )
    return {cid: (subcategorias.get(cid, 0), productos.get(cid, 0)) for cid in categoria_ids}


def get_max_codigo(db: Session) -> str | None:
    return db.scalar(select(func.max(Categoria.codigo)))


def get_by_id(db: Session, categoria_id: int) -> Categoria | None:
    return db.get(Categoria, categoria_id)


def get_by_nombre(db: Session, nombre: str) -> Categoria | None:
    return db.scalar(select(Categoria).where(Categoria.nombre == nombre))


def create(db: Session, categoria: Categoria) -> Categoria:
    db.add(categoria)
    db.flush()
    return categoria


def save(db: Session, categoria: Categoria) -> Categoria:
    db.flush()
    return categoria
