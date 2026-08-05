from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.compra import Compra
from app.models.detalle_compra import DetalleCompra
from app.models.movimiento_inventario import TipoMovimiento
from app.repositories import compra_repository, producto_repository, proveedor_repository
from app.schemas.compra import CompraItemCreate
from app.services import auditoria_service, inventario_service


class ProductoInvalidoError(Exception):
    pass


class ProveedorInvalidoError(Exception):
    pass


class CompraNoEncontradaError(Exception):
    pass


def listar(db: Session, sucursal_id: int, page: int, size: int) -> tuple[list[Compra], int]:
    return compra_repository.get_all(db, sucursal_id, page, size)


def obtener(db: Session, compra_id: int) -> Compra:
    compra = compra_repository.get_by_id(db, compra_id)
    if compra is None:
        raise CompraNoEncontradaError(compra_id)
    return compra


def crear(
    db: Session, usuario_id: int, proveedor_id: int, sucursal_id: int, items: list[CompraItemCreate]
) -> Compra:
    if proveedor_repository.get_by_id(db, proveedor_id) is None:
        raise ProveedorInvalidoError(proveedor_id)
    for item in items:
        if producto_repository.get_by_id(db, item.producto_id) is None:
            raise ProductoInvalidoError(item.producto_id)

    total = sum((item.cantidad * item.costo_unitario for item in items), Decimal("0"))
    compra = Compra(proveedor_id=proveedor_id, sucursal_id=sucursal_id, total=total, usuario_id=usuario_id)
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
            db,
            usuario_id,
            item.producto_id,
            sucursal_id,
            TipoMovimiento.ENTRADA,
            item.cantidad,
            motivo=f"Compra #{compra.id}",
        )

    auditoria_service.registrar(
        db, usuario_id, "compra_registrada", "compra", compra.id, {"total": str(total), "proveedor_id": proveedor_id}
    )
    return compra
