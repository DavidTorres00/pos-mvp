from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.movimiento_inventario import TipoMovimiento
from app.repositories import compra_repository, producto_repository
from app.schemas.compra import CompraItemCreate
from app.services import inventario_service


class ProductoInvalidoError(Exception):
    pass


class CompraNoEncontradaError(Exception):
    pass


def listar(db: Session) -> list[Compra]:
    return compra_repository.get_all(db)


def obtener(db: Session, compra_id: int) -> Compra:
    compra = compra_repository.get_by_id(db, compra_id)
    if compra is None:
        raise CompraNoEncontradaError(compra_id)
    return compra


def crear(db: Session, usuario_id: int, proveedor: str, items: list[CompraItemCreate]) -> Compra:
    for item in items:
        if producto_repository.get_by_id(db, item.producto_id) is None:
            raise ProductoInvalidoError(item.producto_id)

    total = sum((item.cantidad * item.costo_unitario for item in items), Decimal("0"))
    compra = Compra(proveedor=proveedor, total=total, usuario_id=usuario_id)
    compra.items = [
        DetalleCompra(
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            costo_unitario=item.costo_unitario,
            subtotal=item.cantidad * item.costo_unitario,
        )
        for item in items
    ]
    compra = compra_repository.create(db, compra)

    for item in items:
        inventario_service.registrar_movimiento(
            db, usuario_id, item.producto_id, TipoMovimiento.ENTRADA, item.cantidad, motivo=f"Compra #{compra.id}"
        )

    return compra
