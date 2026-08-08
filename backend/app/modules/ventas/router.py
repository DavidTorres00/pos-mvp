from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import Usuario
from app.models.venta import FormaPago
from app.schemas.cancelacion import CancelacionCreate, CancelacionOut
from app.schemas.devolucion import DevolucionCreate, DevolucionOut
from app.schemas.pagination import Pagina
from app.schemas.venta import (
    MovimientoReversaOut,
    ProductoReporteOut,
    ProductoVentaOut,
    VentaCreate,
    VentaOut,
    VentaPorDiaOut,
    VentaPorSucursalOut,
    VentaResumenOut,
)
from app.services import devolucion_service, venta_service
from app.services.venta_service import (
    CajaNoAbiertaError,
    FueraDePlazoError,
    LimiteEfectivoExcedidoError,
    ProductoInvalidoError,
    SinPermisoError,
    StockInsuficienteError,
    TieneDevolucionesError,
    VentaNoEncontradaError,
    VentaYaCanceladaError,
)

router = APIRouter(prefix="/ventas", tags=["ventas"], dependencies=[Depends(get_current_user)])


@router.get("", response_model=Pagina[VentaOut])
def listar(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    sucursal_id: int | None = None,
    usuario_id: int | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[VentaOut]:
    items, total = venta_service.listar(
        db, desde, hasta, forma_pago, sucursal_id, usuario_id, paginacion.page, paginacion.size
    )
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@router.get("/resumen", response_model=VentaResumenOut)
def resumen(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    sucursal_id: int | None = None,
    usuario_id: int | None = None,
    db: Session = Depends(get_db),
) -> VentaResumenOut:
    resumen = venta_service.resumen(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    return VentaResumenOut(**resumen._asdict())


@router.get("/por-sucursal", response_model=list[VentaPorSucursalOut])
def por_sucursal(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    usuario_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[VentaPorSucursalOut]:
    filas = venta_service.por_sucursal(db, desde, hasta, forma_pago, usuario_id)
    return [
        VentaPorSucursalOut(sucursal_id=sid, sucursal_nombre=nombre, total_monto=total, utilidad_total=utilidad, cantidad=cantidad)
        for sid, nombre, total, utilidad, cantidad in filas
    ]


@router.get("/mas-vendidos", response_model=list[ProductoVentaOut])
def mas_vendidos(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    sucursal_id: int | None = None,
    usuario_id: int | None = None,
    limite: int = 5,
    db: Session = Depends(get_db),
) -> list[ProductoVentaOut]:
    items = venta_service.mas_vendidos(db, desde, hasta, forma_pago, sucursal_id, usuario_id, limite)
    return [
        ProductoVentaOut(producto_id=pid, producto_nombre=nombre, cantidad=cantidad, total_vendido=monto)
        for pid, nombre, cantidad, monto in items
    ]


@router.get("/reporte-productos", response_model=list[ProductoReporteOut])
def reporte_productos(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    sucursal_id: int | None = None,
    usuario_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[ProductoReporteOut]:
    """Base del export "Productos vendidos" (`docs/REPORTES_EXPORTACION.md`) — a diferencia de
    `/mas-vendidos` (top-N para la card en pantalla), esta trae todos los productos con ≥1
    venta en el rango, con SKU/categoría/utilidad/margen, sin recorte."""
    items = venta_service.reporte_productos(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    return [
        ProductoReporteOut(
            producto_id=pid,
            sku=sku,
            producto_nombre=nombre,
            categoria_nombre=categoria,
            cantidad=cantidad,
            total_vendido=monto,
            utilidad_total=utilidad,
            margen_pct=margen,
        )
        for pid, sku, nombre, categoria, cantidad, monto, utilidad, margen in items
    ]


@router.get("/devoluciones-cancelaciones", response_model=list[MovimientoReversaOut])
def devoluciones_y_cancelaciones(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    sucursal_id: int | None = None,
    usuario_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[MovimientoReversaOut]:
    """Base del export "Devoluciones y cancelaciones" (`docs/REPORTES_EXPORTACION.md`) — el
    resumen agregado (monto+cantidad) sigue viviendo en `/resumen`, esto es el detalle fila por
    fila para auditoría/revisión."""
    filas = venta_service.devoluciones_y_cancelaciones(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    return [
        MovimientoReversaOut(
            tipo=tipo,
            id=mid,
            venta_id=venta_id,
            created_at=created_at,
            sucursal_nombre=sucursal_nombre,
            actor_nombre=actor_nombre,
            motivo=motivo,
            monto_total=monto_total,
        )
        for tipo, mid, venta_id, created_at, sucursal_nombre, actor_nombre, motivo, monto_total in filas
    ]


@router.get("/por-dia", response_model=list[VentaPorDiaOut])
def por_dia(
    desde: datetime | None = None,
    hasta: datetime | None = None,
    forma_pago: FormaPago | None = None,
    sucursal_id: int | None = None,
    usuario_id: int | None = None,
    db: Session = Depends(get_db),
) -> list[VentaPorDiaOut]:
    filas = venta_service.por_dia(db, desde, hasta, forma_pago, sucursal_id, usuario_id)
    return [VentaPorDiaOut(fecha=fecha, total_monto=total, cantidad=cantidad) for fecha, total, cantidad in filas]




@router.post("", response_model=VentaOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: VentaCreate, db: Session = Depends(get_db), usuario: Usuario = Depends(get_current_user)
) -> VentaOut:
    try:
        return venta_service.crear(db, usuario, payload.items, payload.forma_pago)
    except CajaNoAbiertaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No hay caja abierta")
    except ProductoInvalidoError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uno de los productos no es válido")
    except StockInsuficienteError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Stock insuficiente para el producto {e.producto_id}"
        )
    except LimiteEfectivoExcedidoError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La caja superó el límite de efectivo. Retira el excedente para seguir cobrando.",
        )


@router.get("/{venta_id}", response_model=VentaOut)
def obtener(venta_id: int, db: Session = Depends(get_db)) -> VentaOut:
    try:
        return venta_service.obtener(db, venta_id)
    except VentaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")


@router.get("/{venta_id}/devoluciones", response_model=list[DevolucionOut])
def listar_devoluciones(venta_id: int, db: Session = Depends(get_db)) -> list[DevolucionOut]:
    return devolucion_service.listar_por_venta(db, venta_id)


@router.post("/{venta_id}/devoluciones", response_model=DevolucionOut, status_code=status.HTTP_201_CREATED)
def crear_devolucion(
    venta_id: int,
    payload: DevolucionCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> DevolucionOut:
    try:
        return devolucion_service.crear(db, usuario, venta_id, payload.items, payload.motivo)
    except devolucion_service.VentaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    except devolucion_service.FueraDePlazoError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya pasaron más de 24 horas desde la venta, no se puede devolver",
        )
    except devolucion_service.SinPermisoError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para procesar devoluciones"
        )
    except devolucion_service.LineaInvalidaError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cantidad inválida para la línea {e.detalle_venta_id} (ya no hay esa cantidad disponible)",
        )
    except devolucion_service.SinLineasError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selecciona al menos un producto")
    except devolucion_service.CajaNoAbiertaError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes caja abierta, necesaria para devolver efectivo",
        )
    except devolucion_service.VentaCanceladaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta venta fue cancelada, no se puede devolver")


@router.get("/{venta_id}/cancelacion", response_model=CancelacionOut | None)
def obtener_cancelacion(venta_id: int, db: Session = Depends(get_db)) -> CancelacionOut | None:
    return venta_service.obtener_cancelacion(db, venta_id)


@router.post("/{venta_id}/cancelacion", response_model=CancelacionOut, status_code=status.HTTP_201_CREATED)
def cancelar(
    venta_id: int,
    payload: CancelacionCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CancelacionOut:
    try:
        return venta_service.cancelar(db, usuario, venta_id, payload.motivo)
    except VentaNoEncontradaError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venta no encontrada")
    except VentaYaCanceladaError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta venta ya fue cancelada")
    except TieneDevolucionesError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta venta ya tiene una devolución registrada, no se puede cancelar",
        )
    except FueraDePlazoError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya pasaron más de 24 horas desde la venta, no se puede cancelar",
        )
    except SinPermisoError:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permiso para cancelar ventas")
    except CajaNoAbiertaError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No tienes caja abierta, necesaria para reversar el efectivo",
        )
