from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.models.subcategoria import Subcategoria
from app.repositories import categoria_repository, producto_repository, stock_sucursal_repository, subcategoria_repository
from app.schemas.producto import ProductoOut, ProductoStockOut
from app.services import auditoria_service


class SkuDuplicadoError(Exception):
    pass


class SkuRequeridoError(Exception):
    pass


class ProductoNoEncontradoError(Exception):
    pass


class CategoriaInvalidaError(Exception):
    pass


class SubcategoriaInvalidaError(Exception):
    pass


def _validar_categoria(db: Session, categoria_id: int | None) -> None:
    if categoria_id is not None and categoria_repository.get_by_id(db, categoria_id) is None:
        raise CategoriaInvalidaError(categoria_id)


def _obtener_subcategoria(db: Session, subcategoria_id: int) -> Subcategoria:
    subcategoria = subcategoria_repository.get_by_id(db, subcategoria_id)
    if subcategoria is None:
        raise SubcategoriaInvalidaError(subcategoria_id)
    return subcategoria


def _generar_sku(db: Session, subcategoria: Subcategoria) -> str:
    prefijo = f"{subcategoria.categoria.codigo}{subcategoria.codigo}"
    existentes = producto_repository.get_skus_con_prefijo(db, prefijo)
    max_secuencial = 0
    for sku in existentes:
        sufijo = sku[len(prefijo) :]
        if sufijo.isdigit():
            max_secuencial = max(max_secuencial, int(sufijo))
    return f"{prefijo}{max_secuencial + 1:02d}"


def _a_stock_out(producto: Producto, stock: int) -> ProductoStockOut:
    return ProductoStockOut(**ProductoOut.model_validate(producto).model_dump(), stock=stock)


def listar(
    db: Session, q: str | None, activo: bool | None, sucursal_id: int, page: int, size: int
) -> tuple[list[ProductoStockOut], int]:
    productos, total = producto_repository.get_all(db, q, activo, page, size)
    cantidades = stock_sucursal_repository.get_cantidades(db, [p.id for p in productos], sucursal_id)
    items = [_a_stock_out(p, cantidades.get(p.id, 0)) for p in productos]
    return items, total


def obtener(db: Session, producto_id: int, sucursal_id: int) -> ProductoStockOut:
    producto = producto_repository.get_by_id(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)
    cantidad = stock_sucursal_repository.get_cantidades(db, [producto.id], sucursal_id).get(producto.id, 0)
    return _a_stock_out(producto, cantidad)


def crear(
    db: Session,
    usuario_id: int,
    nombre: str,
    sku: str | None,
    precio_venta: Decimal,
    categoria_id: int | None = None,
    subcategoria_id: int | None = None,
) -> Producto:
    if subcategoria_id is not None:
        subcategoria = _obtener_subcategoria(db, subcategoria_id)
        categoria_id = subcategoria.categoria_id
        sku = _generar_sku(db, subcategoria)
    else:
        if not sku:
            raise SkuRequeridoError()
        if producto_repository.get_by_sku(db, sku) is not None:
            raise SkuDuplicadoError(sku)
        _validar_categoria(db, categoria_id)

    producto = Producto(
        nombre=nombre, sku=sku, precio_venta=precio_venta, categoria_id=categoria_id, subcategoria_id=subcategoria_id
    )
    try:
        with db.begin_nested():
            producto = producto_repository.create(db, producto)
    except IntegrityError:
        raise SkuDuplicadoError(sku)
    auditoria_service.registrar(
        db, usuario_id, "producto_creado", "producto", producto.id, {"sku": sku, "precio_venta": str(precio_venta)}
    )
    return producto


def actualizar(
    db: Session,
    usuario_id: int,
    producto_id: int,
    nombre: str,
    sku: str,
    precio_venta: Decimal,
    categoria_id: int | None = None,
    subcategoria_id: int | None = None,
) -> Producto:
    producto = producto_repository.get_by_id(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)

    existente = producto_repository.get_by_sku(db, sku)
    if existente is not None and existente.id != producto_id:
        raise SkuDuplicadoError(sku)
    if subcategoria_id is not None:
        categoria_id = _obtener_subcategoria(db, subcategoria_id).categoria_id
    else:
        _validar_categoria(db, categoria_id)

    precio_anterior = producto.precio_venta
    producto.nombre = nombre
    producto.sku = sku
    producto.precio_venta = precio_venta
    producto.categoria_id = categoria_id
    producto.subcategoria_id = subcategoria_id
    try:
        with db.begin_nested():
            producto = producto_repository.save(db, producto)
    except IntegrityError:
        raise SkuDuplicadoError(sku)
    if precio_anterior != precio_venta:
        auditoria_service.registrar(
            db,
            usuario_id,
            "producto_precio_cambiado",
            "producto",
            producto.id,
            {"precio_anterior": str(precio_anterior), "precio_nuevo": str(precio_venta)},
        )
    return producto


def cambiar_estado(db: Session, usuario_id: int, producto_id: int, activo: bool) -> Producto:
    producto = producto_repository.get_by_id(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)
    activo_anterior = producto.activo
    producto.activo = activo
    producto = producto_repository.save(db, producto)
    if activo_anterior != activo:
        auditoria_service.registrar(
            db,
            usuario_id,
            "producto_estado_cambiado",
            "producto",
            producto.id,
            {"activo_anterior": activo_anterior, "activo_nuevo": activo},
        )
    return producto
