import asyncio

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role, resolver_usuario_desde_cookie
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.core.eventos_caja import eventos_caja
from app.database.session import SessionLocal, get_db
from app.models.usuario import RolUsuario, Usuario
from app.repositories import equipo_repository
from app.schemas.caja import (
    CajaAbrirRequest,
    CajaActualOut,
    CajaCerrarRequest,
    CajaOut,
    CajaResumenOut,
    MovimientoCajaOut,
    VoucherRetiroOut,
)
from app.schemas.equipo import EquipoOut
from app.schemas.pagination import Pagina
from app.services import caja_service
from app.services.caja_service import (
    CajaNoAbiertaError,
    CajaYaAbiertaError,
    CajaNoEncontradaError,
    EquipoNoDisponibleError,
    EquipoOcupadoError,
    MontoInicialExcedeLimiteError,
    MotivoDiferenciaRequeridoError,
    PermisoRetiroExcedenteError,
    SinExcedenteError,
)

router = APIRouter(prefix="/caja", tags=["caja"], dependencies=[Depends(get_current_user)])

# Router aparte, sin el `Depends(get_current_user)` de arriba: ese depende de `Depends(get_db)`,
# cuya sesión FastAPI mantiene abierta hasta que la respuesta *completa* termina de enviarse —
# para un stream SSE eso es indefinido (horas), así que la sesión quedaba "idle in transaction"
# todo ese tiempo. Un cliente que se desconecta sin avisar (laptop cerrada, cambio de red) la
# dejaba huérfana, sin nadie que la cerrara. `/eventos` autentica con su propia sesión de vida
# corta (cerrada antes de empezar a transmitir) — el resto del stream no vuelve a tocar la DB.
eventos_router = APIRouter(prefix="/caja", tags=["caja"])


@router.get("/actual", response_model=CajaActualOut)
def actual(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)) -> CajaActualOut:
    return caja_service.obtener_actual(db, usuario.id)


@eventos_router.get("/eventos")
async def eventos(request: Request) -> StreamingResponse:
    """Server-Sent Events: complementa (no reemplaza) el polling de 15s de `useCajaActual` en
    el frontend — cuando un admin retira el excedente o cierra la caja de este usuario desde
    otra sesión, `caja_service` notifica por aquí para que se entere al instante en vez de
    esperar el próximo ciclo. El payload no importa, es solo una señal de "vuelve a pedir tu
    caja actual" — la única fuente de verdad sigue siendo `GET /caja/actual`."""
    with SessionLocal() as db:
        usuario = resolver_usuario_desde_cookie(db, request)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas o expiradas")
    usuario_id = usuario.id

    async def generador():
        cola = eventos_caja.suscribirse(usuario_id)
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    await asyncio.wait_for(cola.get(), timeout=25)
                    yield "event: cambio\ndata: caja\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            eventos_caja.desuscribirse(usuario_id, cola)

    return StreamingResponse(generador(), media_type="text/event-stream")


@router.get("/equipos-disponibles", response_model=list[EquipoOut])
def equipos_disponibles(
    db: Session = Depends(get_db), usuario: Usuario = Depends(require_role(RolUsuario.CAJERO))
) -> list[EquipoOut]:
    # forzado a rol cajero en la ruta (no solo confiado a que "nunca" lo llame un admin, ver
    # abrir()): garantiza que usuario.sucursal_id no sea None (CHECK a nivel de base de datos)
    return equipo_repository.get_activos_by_sucursal(db, usuario.sucursal_id)


@router.post("/abrir", response_model=CajaOut, status_code=status.HTTP_201_CREATED)
def abrir(
    payload: CajaAbrirRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.CAJERO)),
) -> CajaOut:
    try:
        return caja_service.abrir(db, usuario.id, payload.equipo_id, payload.monto_inicial)
    except CajaYaAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya tienes una caja abierta")
    except EquipoNoDisponibleError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese equipo no está disponible")
    except EquipoOcupadoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ese equipo ya está en uso")
    except MontoInicialExcedeLimiteError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El monto inicial (${e.monto_inicial}) supera el límite de efectivo configurado (${e.limite}).",
        )


@router.post("/cerrar", response_model=CajaResumenOut)
def cerrar(
    payload: CajaCerrarRequest, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> CajaResumenOut:
    try:
        return caja_service.cerrar(db, usuario.id, usuario.id, payload.monto_final, payload.motivo_diferencia)
    except CajaNoAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay caja abierta")
    except MotivoDiferenciaRequeridoError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Falta efectivo respecto a lo esperado: indica el motivo"
        )


@router.get("/movimientos", response_model=Pagina[MovimientoCajaOut])
def listar_movimientos(
    caja_id: int,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[MovimientoCajaOut]:
    items, total = caja_service.listar_movimientos(db, caja_id, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.post("/retirar-excedente", response_model=VoucherRetiroOut, status_code=status.HTTP_201_CREATED)
def retirar_excedente(db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)) -> VoucherRetiroOut:
    try:
        return caja_service.retirar_excedente(db, usuario, usuario.id)
    except PermisoRetiroExcedenteError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="No tenés permiso para retirar el excedente de caja"
        )
    except CajaNoAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay caja abierta")
    except SinExcedenteError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay excedente que retirar")


@router.get("/ultimo-retiro-excedente", response_model=VoucherRetiroOut | None)
def ultimo_retiro_excedente(
    db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> VoucherRetiroOut | None:
    return caja_service.obtener_ultimo_retiro_excedente(db, usuario.id)


@router.get("/{caja_id}/resumen", response_model=CajaResumenOut)
def resumen(caja_id: int, db: Session = Depends(get_db)) -> CajaResumenOut:
    try:
        return caja_service.resumen(db, caja_id)
    except CajaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Caja no encontrada")
