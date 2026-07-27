from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.movimiento_caja import MovimientoCaja, TipoMovimientoCaja
from app.models.venta import Venta
from app.repositories import caja_repository
from app.schemas.caja import CajaResumenOut


class CajaYaAbiertaError(Exception):
    pass


class CajaNoAbiertaError(Exception):
    pass


class CajaNoEncontradaError(Exception):
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
            return caja_repository.create(db, caja)
    except IntegrityError:
        raise CajaYaAbiertaError()


def registrar_movimiento(db: Session, tipo: TipoMovimientoCaja, monto: Decimal, motivo: str | None) -> MovimientoCaja:
    caja = caja_repository.get_abierta(db)
    if caja is None:
        raise CajaNoAbiertaError()
    movimiento = MovimientoCaja(caja_id=caja.id, tipo=tipo, monto=monto, motivo=motivo)
    return caja_repository.crear_movimiento(db, movimiento)


def _calcular_resumen(db: Session, caja: CajaSesion) -> CajaResumenOut:
    movimientos = caja_repository.get_todos_los_movimientos(db, caja.id)
    total_entradas = sum((m.monto for m in movimientos if m.tipo == TipoMovimientoCaja.ENTRADA), Decimal("0"))
    total_salidas = sum((m.monto for m in movimientos if m.tipo == TipoMovimientoCaja.SALIDA), Decimal("0"))
    ventas = db.scalars(select(Venta).where(Venta.caja_id == caja.id))
    total_ventas_efectivo = sum((v.total for v in ventas), Decimal("0"))
    monto_esperado = caja.monto_inicial + total_ventas_efectivo + total_entradas - total_salidas
    diferencia = caja.monto_final - monto_esperado if caja.monto_final is not None else None
    return CajaResumenOut(
        caja=caja,
        total_ventas_efectivo=total_ventas_efectivo,
        total_entradas=total_entradas,
        total_salidas=total_salidas,
        monto_esperado=monto_esperado,
        diferencia=diferencia,
    )


def resumen(db: Session, caja_id: int) -> CajaResumenOut:
    caja = caja_repository.get_by_id(db, caja_id)
    if caja is None:
        raise CajaNoEncontradaError(caja_id)
    return _calcular_resumen(db, caja)


def cerrar(db: Session, monto_final: Decimal) -> CajaResumenOut:
    caja = caja_repository.get_abierta(db)
    if caja is None:
        raise CajaNoAbiertaError()
    caja.monto_final = monto_final
    caja.abierta = False
    caja.fecha_cierre = datetime.now(timezone.utc)
    caja_repository.save(db, caja)
    return _calcular_resumen(db, caja)
