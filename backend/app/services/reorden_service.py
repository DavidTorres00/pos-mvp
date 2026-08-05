from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.orden_reorden import EstadoOrdenReorden, OrdenReorden
from app.repositories import orden_reorden_repository, regla_reorden_repository, stock_sucursal_repository
from app.services import auditoria_service


class OrdenNoEncontradaError(Exception):
    pass


class OrdenNoPendienteError(Exception):
    pass


def disparar_si_corresponde(db: Session, producto_id: int, sucursal_id: int) -> None:
    """Se llama tras cada salida de inventario (venta, salida manual) en una sucursal. Si el
    producto tiene una regla de reorden activa PARA ESA SUCURSAL y su stock ahí llegó al umbral,
    crea una OrdenReorden pendiente. La combinación de pre-check + índice único parcial (una
    pendiente por regla) evita duplicados aunque dos salidas concurrentes crucen el umbral."""
    regla = regla_reorden_repository.get_by_producto(db, producto_id, sucursal_id)
    if regla is None or not regla.activo:
        return

    stock = stock_sucursal_repository.get(db, producto_id, sucursal_id)
    cantidad_actual = stock.cantidad if stock is not None else 0
    if cantidad_actual > regla.umbral_stock:
        return

    if orden_reorden_repository.get_pendiente_by_regla(db, regla.id) is not None:
        return

    monto_estimado = regla.costo_unitario_estimado * regla.cantidad_pedido
    orden = OrdenReorden(
        regla_reorden_id=regla.id,
        producto_id=regla.producto_id,
        sucursal_id=regla.sucursal_id,
        proveedor_id=regla.proveedor_id,
        cantidad=regla.cantidad_pedido,
        monto_estimado=monto_estimado,
    )
    try:
        with db.begin_nested():
            orden = orden_reorden_repository.create(db, orden)
    except IntegrityError:
        return

    auditoria_service.registrar(
        db,
        None,
        "orden_reorden_disparada",
        "orden_reorden",
        orden.id,
        {"producto_id": producto_id, "cantidad": regla.cantidad_pedido, "monto_estimado": str(monto_estimado)},
    )


def listar(
    db: Session, sucursal_id: int, estado: EstadoOrdenReorden | None, page: int, size: int
) -> tuple[list[OrdenReorden], int]:
    return orden_reorden_repository.get_all(db, sucursal_id, estado, page, size)


def rechazar(db: Session, usuario_id: int, orden_id: int) -> OrdenReorden:
    orden = orden_reorden_repository.get_by_id_for_update(db, orden_id)
    if orden is None:
        raise OrdenNoEncontradaError(orden_id)
    if orden.estado != EstadoOrdenReorden.PENDIENTE:
        raise OrdenNoPendienteError(orden_id)
    orden.estado = EstadoOrdenReorden.RECHAZADA
    orden = orden_reorden_repository.save(db, orden)
    auditoria_service.registrar(db, usuario_id, "orden_reorden_rechazada", "orden_reorden", orden.id)
    return orden
