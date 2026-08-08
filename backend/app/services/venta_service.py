from datetime import UTC, date, datetime, timedelta
from decimal import Decimal
from typing import NamedTuple

from sqlalchemy.orm import Session

from app.models.cancelacion import Cancelacion
from app.models.detalle_venta import DetalleVenta
from app.models.movimiento_caja import MovimientoCaja, TipoMovimientoCaja
from app.models.movimiento_inventario import TipoMovimiento
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import EstadoVenta, FormaPago, Venta
from app.repositories import (
    caja_repository,
    cancelacion_repository,
    devolucion_repository,
    producto_repository,
    stock_sucursal_repository,
    venta_repository,
)
from app.schemas.venta import VentaItemCreate
from app.services import auditoria_service, caja_service, inventario_service

VENTANA_CANCELACION_HORAS = 24


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


class VentaYaCanceladaError(Exception):
    pass


class TieneDevolucionesError(Exception):
    """La venta ya tiene al menos una devolución procesada — cancelar y devolver son
    mutuamente excluyentes (ver docs/BACKEND.md)."""

    pass


class FueraDePlazoError(Exception):
    pass


class SinPermisoError(Exception):
    pass


class ResumenVentas(NamedTuple):
    total_monto: Decimal
    total_neto: Decimal
    cantidad: int
    total_articulos: int
    utilidad_total: Decimal
    margen_pct: Decimal | None
    articulos_con_costo: int
    devoluciones_monto: Decimal
    devoluciones_cantidad: int
    cancelaciones_monto: Decimal
    cancelaciones_cantidad: int


def listar(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
    page: int,
    size: int,
) -> tuple[list[Venta], int]:
    return venta_repository.get_all(db, desde, hasta, forma_pago, sucursal_id, usuario_id, page, size)


def resumen(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> ResumenVentas:
    total, cantidad, articulos, utilidad_total, ventas_con_costo, articulos_con_costo = venta_repository.resumen(
        db, desde, hasta, forma_pago, sucursal_id, usuario_id
    )
    margen_pct = (utilidad_total / ventas_con_costo * 100) if ventas_con_costo > 0 else None
    # netea devoluciones del propio período (fecha de la devolución, no de la venta original —
    # ver devolucion_repository.resumen) contra el bruto ya filtrado; una cancelación no se resta
    # aparte porque la venta cancelada ya viene excluida de `total` desde la raíz
    devoluciones_monto, devoluciones_cantidad = devolucion_repository.resumen(
        db, desde, hasta, forma_pago, sucursal_id, usuario_id
    )
    cancelaciones_monto, cancelaciones_cantidad = cancelacion_repository.resumen(
        db, desde, hasta, forma_pago, sucursal_id, usuario_id
    )
    total_neto = total - devoluciones_monto
    return ResumenVentas(
        total_monto=total,
        total_neto=total_neto,
        cantidad=cantidad,
        total_articulos=articulos,
        utilidad_total=utilidad_total,
        margen_pct=margen_pct,
        articulos_con_costo=articulos_con_costo,
        devoluciones_monto=devoluciones_monto,
        devoluciones_cantidad=devoluciones_cantidad,
        cancelaciones_monto=cancelaciones_monto,
        cancelaciones_cantidad=cancelaciones_cantidad,
    )


def por_sucursal(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    usuario_id: int | None,
) -> list[tuple[int, str, Decimal, Decimal, int]]:
    return venta_repository.por_sucursal(db, desde, hasta, forma_pago, usuario_id)


def mas_vendidos(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
    limite: int,
) -> list[tuple[int, str, int, Decimal]]:
    items = venta_repository.ranking_productos(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    return items[:limite]


def reporte_productos(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[int, str, str, str | None, int, Decimal, Decimal, Decimal | None]]:
    return venta_repository.reporte_productos(db, desde, hasta, forma_pago, sucursal_id, usuario_id)


def devoluciones_y_cancelaciones(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[str, int, int, datetime, str | None, str, str, Decimal]]:
    """Devoluciones y cancelaciones del rango, unificadas y ordenadas por fecha desc — base del
    reporte exportable homónimo (`docs/REPORTES_EXPORTACION.md`). Dos tablas distintas
    (`Devolucion`/`Cancelacion`, ver docs/BACKEND.md) mezcladas en Python: son pocas filas por
    período típico, no vale la pena un `UNION` SQL para esto."""
    devoluciones = devolucion_repository.listar_periodo(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    cancelaciones = cancelacion_repository.listar_periodo(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    filas = [("devolucion", *fila) for fila in devoluciones] + [("cancelacion", *fila) for fila in cancelaciones]
    filas.sort(key=lambda fila: fila[3], reverse=True)
    return filas


def por_dia(
    db: Session,
    desde: datetime | None,
    hasta: datetime | None,
    forma_pago: FormaPago | None,
    sucursal_id: int | None,
    usuario_id: int | None,
) -> list[tuple[date, Decimal, int]]:
    return venta_repository.por_dia(db, desde, hasta, forma_pago, sucursal_id, usuario_id)


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
            # congela el costo del producto en este instante (igual que precio_unitario) — si
            # el producto no tiene costo cargado todavía, queda null, no se inventa un 0
            costo_unitario=productos[item.producto_id].costo,
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


def cancelar(db: Session, actor: Usuario, venta_id: int, motivo: str) -> Cancelacion:
    """Anula la venta completa — error del cajero que nunca debió cerrarse (producto/precio
    equivocado, forma de pago errónea, operación duplicada), a diferencia de una devolución
    (cliente regresa producto de una venta válida). Mismo motor de reversa que
    `devolucion_service.crear` (total, no parcial), pero marca `Venta.estado = cancelada` en vez
    de solo registrar el reverso — la venta deja de contar en cualquier reporte. Ver
    docs/BACKEND.md."""
    venta = venta_repository.get_by_id(db, venta_id)
    if venta is None:
        raise VentaNoEncontradaError(venta_id)

    if venta.estado == EstadoVenta.CANCELADA:
        raise VentaYaCanceladaError()

    if devolucion_repository.get_by_venta(db, venta_id):
        raise TieneDevolucionesError()

    if datetime.now(UTC) - venta.created_at > timedelta(hours=VENTANA_CANCELACION_HORAS):
        raise FueraDePlazoError()

    # mismo criterio de permiso que devolver (ver devolucion_service.crear): admin siempre puede,
    # cajero solo con el permiso explícito — reversar dinero/inventario es la misma clase de
    # acción sea cual sea la razón
    if actor.role != RolUsuario.ADMIN and not actor.puede_hacer_devoluciones:
        raise SinPermisoError()

    # reingresa a la sucursal de la venta original, no a la del actor (puede cancelar remoto)
    sucursal_id = venta.caja.equipo.sucursal_id
    for detalle in venta.items:
        inventario_service.registrar_movimiento(
            db,
            actor.id,
            detalle.producto_id,
            sucursal_id,
            TipoMovimiento.ENTRADA,
            detalle.cantidad,
            motivo=f"Cancelación venta #{venta.id}",
        )

    # efectivo sale de la caja que el actor tiene abierta AHORA, nunca de la original — mismo
    # criterio que devolucion_service.crear
    movimiento_caja_id: int | None = None
    if venta.forma_pago == FormaPago.EFECTIVO:
        caja_actor = caja_repository.get_abierta_for_update_by_usuario(db, actor.id)
        if caja_actor is not None:
            movimiento = MovimientoCaja(
                caja_id=caja_actor.id,
                usuario_id=actor.id,
                tipo=TipoMovimientoCaja.SALIDA,
                monto=venta.total,
                motivo=f"Cancelación venta #{venta.id}",
            )
            movimiento = caja_repository.crear_movimiento(db, movimiento)
            movimiento_caja_id = movimiento.id
        elif actor.role != RolUsuario.ADMIN:
            raise CajaNoAbiertaError()

    cancelacion = Cancelacion(
        venta_id=venta.id,
        actor_id=actor.id,
        motivo=motivo,
        monto_total=venta.total,
        movimiento_caja_id=movimiento_caja_id,
    )
    cancelacion = cancelacion_repository.create(db, cancelacion)

    venta.estado = EstadoVenta.CANCELADA

    auditoria_service.registrar(
        db,
        actor.id,
        "venta_cancelada",
        "venta",
        venta.id,
        {"cancelacion_id": cancelacion.id, "monto_total": str(venta.total), "motivo": motivo},
    )
    return cancelacion


def obtener_cancelacion(db: Session, venta_id: int) -> Cancelacion | None:
    return cancelacion_repository.get_by_venta(db, venta_id)
