from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.detalle_venta import DetalleVenta
from app.models.movimiento_inventario import TipoMovimiento
from app.models.usuario import Usuario
from app.models.venta import FormaPago, Venta
from app.repositories import producto_repository, stock_sucursal_repository, venta_repository
from app.schemas.venta import VentaItemCreate
from app.services import auditoria_service, caja_service, inventario_service


class ProductoInvalidoError(Exception):
    pass


class StockInsuficienteError(Exception):
    def __init__(self, producto_id: int):
        self.producto_id = producto_id


class CajaNoAbiertaError(Exception):
    pass


class LimiteEfectivoExcedidoError(Exception):
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


def crear(db: Session, usuario: Usuario, items: list[VentaItemCreate], forma_pago: FormaPago) -> Venta:
    usuario_id = usuario.id
    caja = caja_service.obtener_abierta(db, usuario_id)
    if caja is None:
        raise CajaNoAbiertaError()
    # la venta que hace que la caja exceda el límite se permite (no queda a medias); ninguna
    # venta más (sea cual sea la forma de pago) hasta que se retire el excedente — regla de
    # negocio explícita para no depender de que el cajero se acuerde de retirar
    if caja_service.excede_limite(db, caja):
        raise LimiteEfectivoExcedidoError()
    sucursal_id = usuario.sucursal_id

    cantidad_solicitada: dict[int, int] = {}
    for item in items:
        cantidad_solicitada[item.producto_id] = cantidad_solicitada.get(item.producto_id, 0) + item.cantidad

    cantidades_stock = stock_sucursal_repository.get_cantidades(db, list(cantidad_solicitada.keys()), sucursal_id)
    productos = {}
    for producto_id, cantidad_total in cantidad_solicitada.items():
        producto = producto_repository.get_by_id(db, producto_id)
        if producto is None or not producto.activo:
            raise ProductoInvalidoError(producto_id)
        if cantidades_stock.get(producto_id, 0) < cantidad_total:
            raise StockInsuficienteError(producto_id)
        productos[producto_id] = producto

    total = sum(
        (item.cantidad * productos[item.producto_id].precio_venta for item in items), Decimal("0")
    )
    venta = Venta(caja_id=caja.id, usuario_id=usuario_id, total=total, forma_pago=forma_pago)
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
            db,
            usuario_id,
            item.producto_id,
            sucursal_id,
            TipoMovimiento.SALIDA,
            item.cantidad,
            motivo=f"Venta #{venta.id}",
        )

    auditoria_service.registrar(
        db, usuario_id, "venta_registrada", "venta", venta.id, {"total": str(total), "forma_pago": forma_pago.value}
    )
    return venta
