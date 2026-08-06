from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.caja import CajaSesion
from app.models.movimiento_caja import MovimientoCaja, TipoMovimientoCaja
from app.models.usuario import RolUsuario, Usuario
from app.models.venta import FormaPago, Venta
from app.repositories import caja_repository, configuracion_repository, equipo_repository, usuario_repository
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


class MontoInicialExcedeLimiteError(Exception):
    def __init__(self, monto_inicial: Decimal, limite: Decimal):
        self.monto_inicial = monto_inicial
        self.limite = limite


class EquipoNoDisponibleError(Exception):
    pass


class EquipoOcupadoError(Exception):
    pass


class MotivoDiferenciaRequeridoError(Exception):
    pass


def obtener_abierta(db: Session, usuario_id: int) -> CajaSesion | None:
    return caja_repository.get_abierta_by_usuario(db, usuario_id)


def listar_movimientos(db: Session, caja_id: int, page: int, size: int) -> tuple[list[MovimientoCaja], int]:
    return caja_repository.get_movimientos(db, caja_id, page, size)


def abrir(db: Session, usuario_id: int, equipo_id: int, monto_inicial: Decimal) -> CajaSesion:
    usuario = usuario_repository.get_by_id(db, usuario_id)
    equipo = equipo_repository.get_by_id(db, equipo_id)
    if equipo is None or not equipo.activo:
        raise EquipoNoDisponibleError()
    # validación server-side: el filtrado del dropdown en frontend es solo UX, no seguridad — sin
    # este chequeo, un cliente modificado podría abrir una caja en un equipo de otra sucursal
    if usuario is None or equipo.sucursal_id != usuario.sucursal_id:
        raise EquipoNoDisponibleError()
    if caja_repository.get_abierta_by_usuario(db, usuario_id) is not None:
        raise CajaYaAbiertaError()
    if caja_repository.get_abierta_by_equipo(db, equipo_id) is not None:
        raise EquipoOcupadoError()
    limite = configuracion_repository.get(db).limite_efectivo_caja
    if limite is not None and monto_inicial > limite:
        raise MontoInicialExcedeLimiteError(monto_inicial, limite)
    caja = CajaSesion(usuario_id=usuario_id, equipo_id=equipo_id, monto_inicial=monto_inicial)
    try:
        with db.begin_nested():
            caja = caja_repository.create(db, caja)
    except IntegrityError:
        # respaldo de una carrera entre el pre-check y el insert; los mensajes precisos ya los
        # dieron los pre-checks del 90%+ de los casos — no vale la pena parsear constraint_name
        raise CajaYaAbiertaError()
    auditoria_service.registrar(
        db, usuario_id, "caja_abierta", "caja_sesion", caja.id, {"monto_inicial": str(monto_inicial)}
    )
    return caja


def _resumen_desde(caja: CajaSesion, movimientos: list[MovimientoCaja], ventas: list[Venta]) -> CajaResumenOut:
    total_entradas = sum((m.monto for m in movimientos if m.tipo == TipoMovimientoCaja.ENTRADA), Decimal("0"))
    total_salidas = sum((m.monto for m in movimientos if m.tipo == TipoMovimientoCaja.SALIDA), Decimal("0"))
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


def _calcular_resumen(db: Session, caja: CajaSesion) -> CajaResumenOut:
    movimientos = caja_repository.get_todos_los_movimientos(db, caja.id)
    ventas = list(db.scalars(select(Venta).where(Venta.caja_id == caja.id)))
    return _resumen_desde(caja, movimientos, ventas)


def _voucher_desde_movimiento(movimiento: MovimientoCaja, caja: CajaSesion) -> VoucherRetiroOut:
    return VoucherRetiroOut(
        movimiento_id=movimiento.id,
        caja_id=caja.id,
        cajero=caja.usuario_nombre,
        # quién ejecutó el retiro: el mismo cajero (self-service) o un admin distinto (remoto) —
        # el frontend decide si vale la pena mostrar esta fila comparándola contra `cajero`
        autorizado_por=movimiento.usuario_nombre,
        sucursal_nombre=caja.sucursal_nombre,
        equipo_nombre=caja.equipo_nombre,
        fecha=movimiento.created_at,
        monto_retirado=movimiento.monto,
        efectivo_anterior=caja.monto_inicial + movimiento.monto,
        efectivo_resultante=caja.monto_inicial,
        monto_inicial=caja.monto_inicial,
    )


def excede_limite(db: Session, caja: CajaSesion) -> bool:
    """True si el efectivo esperado de esta caja YA supera el límite configurado, antes de
    considerar ninguna venta nueva. Usado por venta_service para bloquear cualquier venta nueva
    (sea cual sea la forma de pago) mientras la caja siga excedida — la venta que provoca el
    exceso se permite, ninguna otra hasta retirar el excedente."""
    limite = configuracion_repository.get(db).limite_efectivo_caja
    if limite is None:
        return False
    efectivo_actual = _calcular_resumen(db, caja).monto_esperado
    return efectivo_actual > limite


def resumenes(db: Session, cajas: list[CajaSesion]) -> list[CajaResumenOut]:
    """Resumen de varias cajas a la vez (p. ej. todas las abiertas, una por sucursal/equipo) con
    2 consultas en lugar de 2 por caja — evita el N+1 de llamar resumen() en un loop."""
    if not cajas:
        return []
    caja_ids = [c.id for c in cajas]
    movimientos_por_caja: dict[int, list[MovimientoCaja]] = {}
    for m in caja_repository.get_movimientos_by_caja_ids(db, caja_ids):
        movimientos_por_caja.setdefault(m.caja_id, []).append(m)
    ventas_por_caja: dict[int, list[Venta]] = {}
    for v in db.scalars(select(Venta).where(Venta.caja_id.in_(caja_ids))):
        ventas_por_caja.setdefault(v.caja_id, []).append(v)
    return [
        _resumen_desde(caja, movimientos_por_caja.get(caja.id, []), ventas_por_caja.get(caja.id, []))
        for caja in cajas
    ]


def obtener_actual(db: Session, usuario_id: int) -> CajaActualOut:
    caja = caja_repository.get_abierta_by_usuario(db, usuario_id)
    limite = configuracion_repository.get(db).limite_efectivo_caja
    if caja is None:
        # "última vez que ESTE cajero cerró", no de un equipo en particular: un cajero puede rotar
        # de equipo entre turnos, lo relevante para él es su propio historial, no el del fierro
        ultima_cerrada = caja_repository.get_ultima_cerrada_by_usuario(db, usuario_id)
        ultimo_cierre = ultima_cerrada.fecha_cierre if ultima_cerrada is not None else None
        return CajaActualOut(
            caja=None, efectivo_actual=None, limite_efectivo=limite, excede_limite=False, ultimo_cierre=ultimo_cierre
        )
    efectivo_actual = _calcular_resumen(db, caja).monto_esperado
    excede = limite is not None and efectivo_actual > limite
    return CajaActualOut(
        caja=caja, efectivo_actual=efectivo_actual, limite_efectivo=limite, excede_limite=excede, ultimo_cierre=None
    )


def retirar_excedente(db: Session, actor: Usuario, target_usuario_id: int) -> VoucherRetiroOut:
    """Retira el excedente de la caja de target_usuario_id, auditando con actor.id. Mismo caso
    doble que cerrar(): el cajero retirando la suya (target == actor, gateado por
    puede_retirar_excedente) o el admin retirando la de cualquier cajero (cuadre de caja
    rutinario, no una excepción — el admin siempre puede, de cualquiera)."""
    if actor.role != RolUsuario.ADMIN and (not actor.puede_retirar_excedente or actor.id != target_usuario_id):
        raise PermisoRetiroExcedenteError()

    # lock de fila: dos intentos concurrentes no deben poder disparar el retiro dos veces sobre
    # el mismo excedente (p. ej. el propio cajero y el admin a la vez)
    caja = caja_repository.get_abierta_for_update_by_usuario(db, target_usuario_id)
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
        usuario_id=actor.id,
        tipo=TipoMovimientoCaja.SALIDA,
        monto=excedente,
        motivo=caja_repository.MOTIVO_RETIRO_EXCEDENTE,
    )
    movimiento = caja_repository.crear_movimiento(db, movimiento)
    auditoria_service.registrar(
        db,
        actor.id,
        "caja_retiro_excedente",
        "movimiento_caja",
        movimiento.id,
        {"monto": str(excedente), "efectivo_previo": str(efectivo_actual), "efectivo_resultante": str(caja.monto_inicial)},
    )
    return _voucher_desde_movimiento(movimiento, caja)


def obtener_ultimo_retiro_excedente(db: Session, usuario_id: int) -> VoucherRetiroOut | None:
    """Para que la pantalla del cajero pueda mostrar/imprimir su propio comprobante aunque el
    retiro lo haya disparado un admin de forma remota (sesión/dispositivo distinto): no hay nada
    en tiempo real que le avise, así que el cajero reconstruye el voucher del último retiro de
    excedente de SU caja cuando detecta que ya no está excedida."""
    caja = caja_repository.get_abierta_by_usuario(db, usuario_id)
    if caja is None:
        return None
    movimiento = caja_repository.get_ultimo_retiro_excedente(db, caja.id)
    if movimiento is None:
        return None
    return _voucher_desde_movimiento(movimiento, caja)


def resumen(db: Session, caja_id: int) -> CajaResumenOut:
    caja = caja_repository.get_by_id(db, caja_id)
    if caja is None:
        raise CajaNoEncontradaError(caja_id)
    return _calcular_resumen(db, caja)


def cerrar(
    db: Session, actor_id: int, target_usuario_id: int, monto_final: Decimal, motivo_diferencia: str | None = None
) -> CajaResumenOut:
    """Cierra la caja de target_usuario_id, auditando el evento con actor_id. Cubre dos casos:
    un cajero cerrando la suya (actor_id == target_usuario_id) o un admin cerrando la de otro
    cajero (corte de emergencia, actor_id = admin, target_usuario_id = el cajero)."""
    caja = caja_repository.get_abierta_by_usuario(db, target_usuario_id)
    if caja is None:
        raise CajaNoAbiertaError()
    # el esperado se calcula ANTES de tocar la caja (monto_final aún None en este punto) para
    # poder validar el faltante antes de comprometer el cierre — si se exigiera el motivo
    # después de guardar, ya no habría forma limpia de rechazar el cierre
    monto_esperado = _calcular_resumen(db, caja).monto_esperado
    diferencia = monto_final - monto_esperado
    if diferencia < 0 and not (motivo_diferencia and motivo_diferencia.strip()):
        raise MotivoDiferenciaRequeridoError()

    caja.monto_final = monto_final
    caja.abierta = False
    caja.fecha_cierre = datetime.now(timezone.utc)
    caja_repository.save(db, caja)
    resumen = _calcular_resumen(db, caja)
    auditoria_service.registrar(
        db,
        actor_id,
        "caja_cerrada",
        "caja_sesion",
        caja.id,
        {
            "monto_final": str(monto_final),
            "diferencia": str(resumen.diferencia) if resumen.diferencia is not None else None,
            "motivo_diferencia": motivo_diferencia,
        },
    )
    return resumen
