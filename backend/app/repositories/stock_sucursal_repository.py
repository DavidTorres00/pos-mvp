from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.stock_sucursal import StockSucursal


def get(db: Session, producto_id: int, sucursal_id: int) -> StockSucursal | None:
    return db.get(StockSucursal, (producto_id, sucursal_id))


def get_for_update(db: Session, producto_id: int, sucursal_id: int) -> StockSucursal | None:
    stmt = (
        select(StockSucursal)
        .where(StockSucursal.producto_id == producto_id, StockSucursal.sucursal_id == sucursal_id)
        .with_for_update(of=StockSucursal)
    )
    return db.scalar(stmt)


def get_or_create_for_update(db: Session, producto_id: int, sucursal_id: int) -> StockSucursal:
    """La ausencia de fila significa stock cero en esa sucursal (tabla de hechos pura, no se
    inicializa una fila por sucursal al crear el producto). La crea perezosamente en el primer
    movimiento, con lock de fila desde el insert para que dos movimientos concurrentes sobre un
    producto sin stock previo en esta sucursal no se pisen."""
    stock = get_for_update(db, producto_id, sucursal_id)
    if stock is not None:
        return stock
    stock = StockSucursal(producto_id=producto_id, sucursal_id=sucursal_id, cantidad=0)
    try:
        with db.begin_nested():
            db.add(stock)
            db.flush()
    except IntegrityError:
        pass
    return get_for_update(db, producto_id, sucursal_id)  # type: ignore[return-value]


def get_cantidades(db: Session, producto_ids: list[int], sucursal_id: int) -> dict[int, int]:
    if not producto_ids:
        return {}
    stmt = select(StockSucursal.producto_id, StockSucursal.cantidad).where(
        StockSucursal.producto_id.in_(producto_ids), StockSucursal.sucursal_id == sucursal_id
    )
    return dict(db.execute(stmt).all())


def save(db: Session, stock: StockSucursal) -> StockSucursal:
    db.flush()
    return stock
