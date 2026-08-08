from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.tiempo import hoy_negocio
from app.models.sucursal import Sucursal
from app.repositories import (
    alerta_acuse_repository,
    auditoria_repository,
    caja_repository,
    configuracion_repository,
    equipo_repository,
    reporte_repository,
    sucursal_repository,
    usuario_repository,
)
from app.schemas.caja import CajaResumenOut
from app.schemas.reporte import AlertaOut, SucursalResumenOut
from app.services import caja_service

# únicos tipos de alerta basados en un hecho histórico inmutable — las demás (caja_excedida,
# caja_sin_cierre, stock_bajo, sin_stock) describen una condición viva que se resuelve sola,
# acusarlas a mano solo escondería un problema que sigue ahí
TIPOS_ACUSABLES = {"faltante_caja"}

HORAS_CAJA_SIN_CIERRE = 24
HORAS_FALTANTE_RECIENTE = 48


def cajas_abiertas(db: Session) -> list[CajaResumenOut]:
    return caja_service.resumenes(db, caja_repository.get_abiertas(db))


def resumen_sucursales(db: Session) -> list[SucursalResumenOut]:
    fecha = hoy_negocio()
    sucursales = sucursal_repository.get_activas(db)
    ventas_por_sucursal = reporte_repository.ventas_por_sucursal_del_dia(db, fecha)

    equipos_activos_por_sucursal: dict[int, int] = {}
    sucursal_por_equipo: dict[int, int] = {}
    for equipo in equipo_repository.get_activos(db):
        equipos_activos_por_sucursal[equipo.sucursal_id] = equipos_activos_por_sucursal.get(equipo.sucursal_id, 0) + 1
        sucursal_por_equipo[equipo.id] = equipo.sucursal_id

    cajas = caja_repository.get_abiertas(db)
    resumenes = caja_service.resumenes(db, cajas)
    limite_global = configuracion_repository.get(db).limite_efectivo_caja
    limite_por_sucursal = {
        s.id: (s.limite_efectivo_caja if s.limite_efectivo_caja is not None else limite_global) for s in sucursales
    }

    cajas_por_sucursal: dict[int, dict[str, int | Decimal]] = {}
    for caja, resumen in zip(cajas, resumenes, strict=True):
        sucursal_id = sucursal_por_equipo.get(caja.equipo_id)
        if sucursal_id is None:
            continue
        bucket = cajas_por_sucursal.setdefault(
            sucursal_id, {"cajas_abiertas": 0, "efectivo_esperado": Decimal("0"), "cajas_excedidas": 0}
        )
        bucket["cajas_abiertas"] += 1
        bucket["efectivo_esperado"] += resumen.monto_esperado
        limite = limite_por_sucursal.get(sucursal_id)
        if limite is not None and resumen.monto_esperado > limite:
            bucket["cajas_excedidas"] += 1

    resultado = []
    for sucursal in sucursales:
        ventas_total, ventas_cantidad = ventas_por_sucursal.get(sucursal.id, (Decimal("0"), 0))
        bucket = cajas_por_sucursal.get(
            sucursal.id, {"cajas_abiertas": 0, "efectivo_esperado": Decimal("0"), "cajas_excedidas": 0}
        )
        resultado.append(
            SucursalResumenOut(
                sucursal_id=sucursal.id,
                sucursal_nombre=sucursal.nombre,
                ventas_hoy=ventas_total,
                cantidad_ventas_hoy=ventas_cantidad,
                efectivo_esperado=bucket["efectivo_esperado"],
                cajas_abiertas=bucket["cajas_abiertas"],
                equipos_activos=equipos_activos_por_sucursal.get(sucursal.id, 0),
                cajas_excedidas=bucket["cajas_excedidas"],
            )
        )
    return resultado


def _meta_por_equipo(db: Session, sucursales_activas: list[Sucursal]) -> dict[int, tuple[int, Decimal | None]]:
    """(sucursal_id, límite de efectivo vigente) por equipo — resuelve el override de su
    sucursal si existe, si no el default global (mismo criterio que
    `caja_service.limite_efectivo_para_sucursal`, calculado una sola vez para todos los equipos
    en vez de una consulta por caja). El `sucursal_id` es lo que permite que las alertas de caja
    del feed de atención lleven al frontend directo a la fila exacta, no solo a la página general."""
    limite_global = configuracion_repository.get(db).limite_efectivo_caja
    limites_por_sucursal = {
        s.id: (s.limite_efectivo_caja if s.limite_efectivo_caja is not None else limite_global)
        for s in sucursales_activas
    }
    return {
        e.id: (e.sucursal_id, limites_por_sucursal.get(e.sucursal_id, limite_global))
        for e in equipo_repository.get_activos(db)
    }


def _alertas_cajas_excedidas(
    db: Session, resumenes: list[CajaResumenOut], meta_por_equipo: dict[int, tuple[int, Decimal | None]]
) -> list[AlertaOut]:
    alertas = []
    for resumen in resumenes:
        meta = meta_por_equipo.get(resumen.caja.equipo_id)
        if meta is None:
            continue
        sucursal_id, limite = meta
        if limite is None or resumen.monto_esperado <= limite:
            continue
        usuario = usuario_repository.get_by_id(db, resumen.caja.usuario_id)
        puede_retirar = usuario is not None and usuario.puede_retirar_excedente
        alertas.append(
            AlertaOut(
                tipo="caja_excedida",
                titulo="Caja excedida sin retirar",
                descripcion=(
                    f"{resumen.caja.equipo_nombre} acumula ${resumen.monto_esperado:,.2f}, arriba del máximo de "
                    f"${limite:,.2f}. {resumen.caja.usuario_nombre} "
                    + ("puede retirarlo él mismo." if puede_retirar else "no tiene permiso de retiro.")
                ),
                sucursal_nombre=resumen.caja.sucursal_nombre,
                cantidad=1,
                # no se registra el instante en que el efectivo cruzó el límite, solo que ya lo
                # cruzó ahora — mostrar la apertura de la caja como si fuera "desde cuándo está
                # excedida" sería una fecha inventada
                created_at=None,
                sucursal_id=sucursal_id,
                equipo_id=resumen.caja.equipo_id,
                auditoria_id=None,
            )
        )
    return alertas


def _alertas_cajas_sin_cierre(cajas: list) -> list[AlertaOut]:
    ahora = datetime.now(UTC)
    alertas = []
    for caja in cajas:
        antiguedad = ahora - caja.fecha_apertura
        if antiguedad <= timedelta(hours=HORAS_CAJA_SIN_CIERRE):
            continue
        horas = int(antiguedad.total_seconds() // 3600)
        alertas.append(
            AlertaOut(
                tipo="caja_sin_cierre",
                titulo=f"Caja abierta hace más de {HORAS_CAJA_SIN_CIERRE} horas",
                descripcion=f"{caja.equipo_nombre} sigue abierta desde hace {horas} h, a nombre de {caja.usuario_nombre}.",
                sucursal_nombre=caja.sucursal_nombre,
                cantidad=1,
                created_at=caja.fecha_apertura,
                sucursal_id=caja.equipo.sucursal_id,
                equipo_id=caja.equipo_id,
                auditoria_id=None,
            )
        )
    return alertas


def _alertas_stock_bajo(db: Session) -> list[AlertaOut]:
    """Una alerta por sucursal afectada, nunca una sola mezclando todas — una alerta "todas las
    sucursales" no le dice al admin a cuál ir a resolver, y el link de 'Ver productos' del
    frontend solo puede aterrizar en una sucursal a la vez de todos modos (la que esté activa en
    `sucursalActivaStore`)."""
    umbral = configuracion_repository.get(db).umbral_stock_bajo_default
    if umbral is None:
        return []
    bajos = reporte_repository.productos_bajo_umbral(db, umbral)
    if not bajos:
        return []
    conteo_por_sucursal: dict[int, int] = {}
    for _, stock in bajos:
        conteo_por_sucursal[stock.sucursal_id] = conteo_por_sucursal.get(stock.sucursal_id, 0) + 1
    alertas = []
    for sucursal_id, cantidad in conteo_por_sucursal.items():
        sucursal = sucursal_repository.get_by_id(db, sucursal_id)
        alertas.append(
            AlertaOut(
                tipo="stock_bajo",
                titulo=f"{cantidad} {'producto' if cantidad == 1 else 'productos'} con stock bajo",
                descripcion=f"En o debajo de {umbral} unidades — conviene preparar un pedido a su proveedor.",
                sucursal_nombre=sucursal.nombre if sucursal is not None else None,
                cantidad=cantidad,
                # es un corte del inventario ahora mismo, no un evento con fecha propia
                created_at=None,
                sucursal_id=sucursal_id,
                equipo_id=None,
                auditoria_id=None,
            )
        )
    return alertas


def _alertas_sin_stock(db: Session, sucursales_activas: list[Sucursal]) -> list[AlertaOut]:
    """Una alerta por sucursal afectada — mismo criterio que `_alertas_stock_bajo`."""
    total_productos = reporte_repository.total_productos_activos(db)
    if total_productos == 0:
        return []
    con_stock_por_sucursal = reporte_repository.conteo_con_stock_por_sucursal(db)
    return [
        AlertaOut(
            tipo="sin_stock",
            titulo=f"{cantidad} {'producto' if cantidad == 1 else 'productos'} sin stock",
            descripcion="Sin unidades disponibles para vender hasta que se registre una entrada de inventario.",
            sucursal_nombre=sucursal.nombre,
            cantidad=cantidad,
            # es un corte del inventario ahora mismo, no un evento con fecha propia
            created_at=None,
            sucursal_id=sucursal.id,
            equipo_id=None,
            auditoria_id=None,
        )
        for sucursal in sucursales_activas
        if (cantidad := total_productos - con_stock_por_sucursal.get(sucursal.id, 0)) > 0
    ]


def _alertas_faltante_caja(db: Session) -> list[AlertaOut]:
    desde = datetime.now(UTC) - timedelta(hours=HORAS_FALTANTE_RECIENTE)
    eventos = auditoria_repository.get_recientes_por_accion(db, "caja_cerrada", desde)
    acusadas = alerta_acuse_repository.get_referencias_acusadas(db, "faltante_caja")
    alertas = []
    for evento in eventos:
        if evento.id in acusadas:
            continue
        detalle = evento.detalle or {}
        diferencia_str = detalle.get("diferencia")
        if diferencia_str is None:
            continue
        diferencia = Decimal(diferencia_str)
        if diferencia >= 0:
            continue
        cajero = evento.usuario.nombre if evento.usuario is not None else "un cajero"
        motivo = detalle.get("motivo_diferencia")
        # entidad_id es el id de la CajaSesion cerrada (ver caja_service.cerrar) — se resuelve
        # para saber de qué sucursal es este faltante, el evento de auditoría no la guarda directo
        caja = caja_repository.get_by_id(db, evento.entidad_id) if evento.entidad_id is not None else None
        alertas.append(
            AlertaOut(
                tipo="faltante_caja",
                titulo=f"Faltante de ${abs(diferencia):,.2f} en un cierre de caja",
                descripcion=(
                    f"El cierre de {cajero} tuvo un faltante. " + (f"Motivo: {motivo}." if motivo else "Sin justificación registrada.")
                ),
                sucursal_nombre=caja.sucursal_nombre if caja is not None else None,
                cantidad=1,
                created_at=evento.created_at,
                sucursal_id=caja.equipo.sucursal_id if caja is not None else None,
                equipo_id=caja.equipo_id if caja is not None else None,
                auditoria_id=evento.id,
            )
        )
    return alertas


def atencion(db: Session) -> list[AlertaOut]:
    cajas = caja_repository.get_abiertas(db)
    resumenes = caja_service.resumenes(db, cajas)
    sucursales_activas = sucursal_repository.get_activas(db)

    alertas: list[AlertaOut] = []
    alertas += _alertas_cajas_excedidas(db, resumenes, _meta_por_equipo(db, sucursales_activas))
    alertas += _alertas_cajas_sin_cierre(cajas)
    alertas += _alertas_stock_bajo(db)
    alertas += _alertas_sin_stock(db, sucursales_activas)
    alertas += _alertas_faltante_caja(db)
    return alertas


class TipoAlertaNoAcusableError(Exception):
    """El tipo de alerta no es de los que se pueden marcar como revisados — ver TIPOS_ACUSABLES."""

    pass


def acusar_alerta(db: Session, usuario_id: int, tipo: str, referencia_id: int) -> None:
    if tipo not in TIPOS_ACUSABLES:
        raise TipoAlertaNoAcusableError(tipo)
    alerta_acuse_repository.crear(db, tipo, referencia_id, usuario_id)
