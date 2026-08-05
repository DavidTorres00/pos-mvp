from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.regla_reorden import ReglaReorden
from app.repositories import producto_repository, proveedor_repository, regla_reorden_repository
from app.services import auditoria_service


class ReglaYaExisteError(Exception):
    pass


class ReglaNoEncontradaError(Exception):
    pass


class ProductoInvalidoError(Exception):
    pass


class ProveedorInvalidoError(Exception):
    pass


def _validar_referencias(db: Session, producto_id: int, proveedor_id: int) -> None:
    if producto_repository.get_by_id(db, producto_id) is None:
        raise ProductoInvalidoError(producto_id)
    if proveedor_repository.get_by_id(db, proveedor_id) is None:
        raise ProveedorInvalidoError(proveedor_id)


def listar(db: Session, sucursal_id: int, page: int, size: int) -> tuple[list[ReglaReorden], int]:
    return regla_reorden_repository.get_all(db, sucursal_id, page, size)


def obtener(db: Session, regla_id: int) -> ReglaReorden:
    regla = regla_reorden_repository.get_by_id(db, regla_id)
    if regla is None:
        raise ReglaNoEncontradaError(regla_id)
    return regla


def crear(
    db: Session,
    usuario_id: int,
    producto_id: int,
    sucursal_id: int,
    proveedor_id: int,
    umbral_stock: int,
    cantidad_pedido: int,
    costo_unitario_estimado: Decimal,
) -> ReglaReorden:
    _validar_referencias(db, producto_id, proveedor_id)
    if regla_reorden_repository.get_by_producto(db, producto_id, sucursal_id) is not None:
        raise ReglaYaExisteError(producto_id)
    regla = ReglaReorden(
        producto_id=producto_id,
        sucursal_id=sucursal_id,
        proveedor_id=proveedor_id,
        umbral_stock=umbral_stock,
        cantidad_pedido=cantidad_pedido,
        costo_unitario_estimado=costo_unitario_estimado,
    )
    try:
        with db.begin_nested():
            regla = regla_reorden_repository.create(db, regla)
    except IntegrityError:
        raise ReglaYaExisteError(producto_id)
    auditoria_service.registrar(
        db,
        usuario_id,
        "regla_reorden_creada",
        "regla_reorden",
        regla.id,
        {"producto_id": producto_id, "umbral_stock": umbral_stock, "cantidad_pedido": cantidad_pedido},
    )
    return regla


def actualizar(
    db: Session,
    regla_id: int,
    proveedor_id: int,
    umbral_stock: int,
    cantidad_pedido: int,
    costo_unitario_estimado: Decimal,
) -> ReglaReorden:
    regla = regla_reorden_repository.get_by_id(db, regla_id)
    if regla is None:
        raise ReglaNoEncontradaError(regla_id)
    if proveedor_repository.get_by_id(db, proveedor_id) is None:
        raise ProveedorInvalidoError(proveedor_id)
    regla.proveedor_id = proveedor_id
    regla.umbral_stock = umbral_stock
    regla.cantidad_pedido = cantidad_pedido
    regla.costo_unitario_estimado = costo_unitario_estimado
    return regla_reorden_repository.save(db, regla)


def cambiar_estado(db: Session, usuario_id: int, regla_id: int, activo: bool) -> ReglaReorden:
    regla = regla_reorden_repository.get_by_id(db, regla_id)
    if regla is None:
        raise ReglaNoEncontradaError(regla_id)
    activo_anterior = regla.activo
    regla.activo = activo
    regla = regla_reorden_repository.save(db, regla)
    if activo_anterior != activo:
        auditoria_service.registrar(
            db,
            usuario_id,
            "regla_reorden_estado_cambiado",
            "regla_reorden",
            regla.id,
            {"activo_anterior": activo_anterior, "activo_nuevo": activo},
        )
    return regla
