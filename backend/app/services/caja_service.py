from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.movimiento_caja import MovimientoCaja, TipoMovimientoCaja
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import FormaPago, Venta
from app.repositories import caja_repository, configuracion_repository
from app.schemas.caja import CajaActualOut, CajaResumenOut, VoucherRetiroOut
from app.services import auditoria_service


class CajaYaAbiertaError(Exception):
    pass


class CajaNoAbiertaError(Exception):
    pass


class CajaNoEncontradaError(Exception):
    pass


class SinExcedenteError(Exception):
    pass


class PermisoRetiroExcedenteError(Exception):
    pass


def obtener_abierta(db: Session) -> CajaSesion | None:
    return caja_repository.get_abierta(db)


def listar_movimientos(db: Session, caja_id: int, page: int, size: int) -> tuple[list[MovimientoCaja], int]:
    return caja_repository.get_movimientos(db, caja_id, page, size)


def abrir(db: Session, usuario_id: int, monto_inicial: Decimal) -> CajaSesion:
    if caja_repository.get_abierta(db) is not None:
        raise CajaYaAbiertaError()
    caja = CajaSesion(usuario_id=usuario_id, monto_inicial=monto_inicial)
    try:
        with db.begin_nested():
            caja = caja_repository.create(db, caja)
    except IntegrityError:
        raise CajaYaAbiertaError()
    auditoria_service.registrar(
        db, usuario_id, "caja_abierta", "caja_sesion", caja.id, {"monto_inicial": str(monto_inicial)}
    )
    return caja


def registrar_movimiento(
    db: Session, usuario_id: int, tipo: TipoMovimientoCaja, monto: Decimal, motivo: str | None
) -> MovimientoCaja:
    caja = caja_repository.get_abierta(db)
    if caja is None:
        raise CajaNoAbiertaError()
    movimiento = MovimientoCaja(caja_id=caja.id, usuario_id=usuario_id, tipo=tipo, monto=monto, motivo=motivo)
    movimiento = caja_repository.crear_movimiento(db, movimiento)
    auditoria_service.registrar(
        db,
        usuario_id,
        f"caja_movimiento_{tipo.value}",
        "movimiento_caja",
        movimiento.id,
        {"monto": str(monto), "motivo": motivo},
    )
    return movimiento


def _calcular_resumen(db: Session, caja: CajaSesion) -> CajaResumenOut:
    movimientos = caja_repository.get_todos_los_movimientos(db, caja.id)
    total_entradas = sum((m.monto for m in movimientos if m.tipo == TipoMovimientoCaja.ENTRADA), Decimal("0"))
    total_salidas = sum((m.monto for m in movimientos if m.tipo == TipoMovimientoCaja.SALIDA), Decimal("0"))
    ventas = list(db.scalars(select(Venta).where(Venta.caja_id == caja.id)))
    # solo las ventas en efectivo suman al efectivo físico de la caja: tarjeta/transferencia
    # las cobra la terminal/banco, ese dinero nunca entra al cajón
    total_ventas_efectivo = sum((v.total for v in ventas if v.forma_pago == FormaPago.EFECTIVO), Decimal("0"))
    total_ventas_tarjeta = sum((v.total for v in ventas if v.forma_pago == FormaPago.TARJETA), Decimal("0"))
    total_ventas_transferencia = sum(
        (v.total for v in ventas if v.forma_pago == FormaPago.TRANSFERENCIA), Decimal("0")
    )
    monto_esperado = caja.monto_inicial + total_ventas_efectivo + total_entradas - total_salidas
    diferencia = caja.monto_final - monto_esperado if caja.monto_final is not None else None
    return CajaResumenOut(
        caja=caja,
        total_ventas_efectivo=total_ventas_efectivo,
        total_ventas_tarjeta=total_ventas_tarjeta,
        total_ventas_transferencia=total_ventas_transferencia,
        total_entradas=total_entradas,
        total_salidas=total_salidas,
        monto_esperado=monto_esperado,
        diferencia=diferencia,
    )


def obtener_actual(db: Session) -> CajaActualOut:
    caja = caja_repository.get_abierta(db)
    limite = configuracion_repository.get(db).limite_efectivo_caja
    if caja is None:
        return CajaActualOut(caja=None, efectivo_actual=None, limite_efectivo=limite, excede_limite=False)
    efectivo_actual = _calcular_resumen(db, caja).monto_esperado
    excede = limite is not None and efectivo_actual > limite
    return CajaActualOut(caja=caja, efectivo_actual=efectivo_actual, limite_efectivo=limite, excede_limite=excede)


def retirar_excedente(db: Session, usuario: Usuario) -> VoucherRetiroOut:
    if usuario.role != RolUsuario.ADMIN and not usuario.puede_retirar_excedente:
        raise PermisoRetiroExcedenteError()

    # lock de fila: dos cajeros no deben poder disparar el retiro dos veces sobre el mismo excedente
    caja = caja_repository.get_abierta_for_update(db)
    if caja is None:
        raise CajaNoAbiertaError()

    limite = configuracion_repository.get(db).limite_efectivo_caja
    efectivo_actual = _calcular_resumen(db, caja).monto_esperado
    if limite is None or efectivo_actual <= limite:
        raise SinExcedenteError()

    # el retiro siempre devuelve la caja exactamente al fondo inicial, no solo por debajo del límite
    excedente = efectivo_actual - caja.monto_inicial
    movimiento = MovimientoCaja(
        caja_id=caja.id,
        usuario_id=usuario.id,
        tipo=TipoMovimientoCaja.SALIDA,
        monto=excedente,
        motivo="Retiro por excedente de efectivo",
    )
    movimiento = caja_repository.crear_movimiento(db, movimiento)
    auditoria_service.registrar(
        db,
        usuario.id,
        "caja_retiro_excedente",
        "movimiento_caja",
        movimiento.id,
        {"monto": str(excedente), "efectivo_previo": str(efectivo_actual), "efectivo_resultante": str(caja.monto_inicial)},
    )
    return VoucherRetiroOut(
        movimiento_id=movimiento.id,
        caja_id=caja.id,
        cajero=usuario.nombre,
        fecha=movimiento.created_at,
        monto_retirado=excedente,
        efectivo_anterior=efectivo_actual,
        efectivo_resultante=caja.monto_inicial,
        monto_inicial=caja.monto_inicial,
    )


def resumen(db: Session, caja_id: int) -> CajaResumenOut:
    caja = caja_repository.get_by_id(db, caja_id)
    if caja is None:
        raise CajaNoEncontradaError(caja_id)
    return _calcular_resumen(db, caja)


def cerrar(db: Session, usuario_id: int, monto_final: Decimal) -> CajaResumenOut:
    caja = caja_repository.get_abierta(db)
    if caja is None:
        raise CajaNoAbiertaError()
    caja.monto_final = monto_final
    caja.abierta = False
    caja.fecha_cierre = datetime.now(timezone.utc)
    caja_repository.save(db, caja)
    resumen = _calcular_resumen(db, caja)
    auditoria_service.registrar(
        db,
        usuario_id,
        "caja_cerrada",
        "caja_sesion",
        caja.id,
        {"monto_final": str(monto_final), "diferencia": str(resumen.diferencia) if resumen.diferencia is not None else None},
    )
    return resumen
