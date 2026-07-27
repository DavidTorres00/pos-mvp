from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.detalle_venta import DetalleVenta
from app.models.movimiento_inventario import TipoMovimiento
from app.models.venta import Venta
from app.repositories import producto_repository, venta_repository
from app.schemas.venta import VentaItemCreate
from app.services import caja_service, inventario_service


class ProductoInvalidoError(Exception):
    pass


class StockInsuficienteError(Exception):
    def __init__(self, producto_id: int):
        self.producto_id = producto_id


class CajaNoAbiertaError(Exception):
    pass


class VentaNoEncontradaError(Exception):
    pass


def listar(db: Session, page: int, size: int) -> tuple[list[Venta], int]:
    return venta_repository.get_all(db, page, size)


def obtener(db: Session, venta_id: int) -> Venta:
    venta = venta_repository.get_by_id(db, venta_id)
    if venta is None:
        raise VentaNoEncontradaError(venta_id)
    return venta


def crear(db: Session, usuario_id: int, items: list[VentaItemCreate]) -> Venta:
    caja = caja_service.obtener_abierta(db)
    if caja is None:
        raise CajaNoAbiertaError()

    cantidad_solicitada: dict[int, int] = {}
    for item in items:
        cantidad_solicitada[item.producto_id] = cantidad_solicitada.get(item.producto_id, 0) + item.cantidad

    productos = {}
    for producto_id, cantidad_total in cantidad_solicitada.items():
        producto = producto_repository.get_by_id(db, producto_id)
        if producto is None or not producto.activo:
            raise ProductoInvalidoError(producto_id)
        if producto.stock < cantidad_total:
            raise StockInsuficienteError(producto_id)
        productos[producto_id] = producto

    total = sum(
        (item.cantidad * productos[item.producto_id].precio_venta for item in items), Decimal("0")
    )
    venta = Venta(caja_id=caja.id, usuario_id=usuario_id, total=total)
    venta.items = [
        DetalleVenta(
            producto_id=item.producto_id,
            cantidad=item.cantidad,
            precio_unitario=productos[item.producto_id].precio_venta,
            subtotal=item.cantidad * productos[item.producto_id].precio_venta,
        )
        for item in items
    ]
    venta = venta_repository.create(db, venta)

    for item in items:
        inventario_service.registrar_movimiento(
            db, usuario_id, item.producto_id, TipoMovimiento.SALIDA, item.cantidad, motivo=f"Venta #{venta.id}"
        )

    return venta
