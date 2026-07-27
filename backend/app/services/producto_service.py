from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.producto import Producto
from app.repositories import categoria_repository, producto_repository


class SkuDuplicadoError(Exception):
    pass


class ProductoNoEncontradoError(Exception):
    pass


class CategoriaInvalidaError(Exception):
    pass


def _validar_categoria(db: Session, categoria_id: int | None) -> None:
    if categoria_id is not None and categoria_repository.get_by_id(db, categoria_id) is None:
        raise CategoriaInvalidaError(categoria_id)


def listar(db: Session, q: str | None, page: int, size: int) -> tuple[list[Producto], int]:
    return producto_repository.get_all(db, q, page, size)


def obtener(db: Session, producto_id: int) -> Producto:
    producto = producto_repository.get_by_id(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)
    return producto


def crear(db: Session, nombre: str, sku: str, precio_venta: Decimal, categoria_id: int | None = None) -> Producto:
    if producto_repository.get_by_sku(db, sku) is not None:
        raise SkuDuplicadoError(sku)
    _validar_categoria(db, categoria_id)
    producto = Producto(nombre=nombre, sku=sku, precio_venta=precio_venta, categoria_id=categoria_id)
    try:
        with db.begin_nested():
            return producto_repository.create(db, producto)
    except IntegrityError:
        raise SkuDuplicadoError(sku)


def actualizar(
    db: Session, producto_id: int, nombre: str, sku: str, precio_venta: Decimal, categoria_id: int | None = None
) -> Producto:
    producto = producto_repository.get_by_id(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)

    existente = producto_repository.get_by_sku(db, sku)
    if existente is not None and existente.id != producto_id:
        raise SkuDuplicadoError(sku)
    _validar_categoria(db, categoria_id)

    producto.nombre = nombre
    producto.sku = sku
    producto.precio_venta = precio_venta
    producto.categoria_id = categoria_id
    try:
        with db.begin_nested():
            return producto_repository.save(db, producto)
    except IntegrityError:
        raise SkuDuplicadoError(sku)


def cambiar_estado(db: Session, producto_id: int, activo: bool) -> Producto:
    producto = producto_repository.get_by_id(db, producto_id)
    if producto is None:
        raise ProductoNoEncontradoError(producto_id)
    producto.activo = activo
    return producto_repository.save(db, producto)
