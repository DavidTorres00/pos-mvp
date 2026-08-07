from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.proveedor import Proveedor
from app.repositories import proveedor_repository
from app.schemas.proveedor import ProveedorResumenOut
from app.services import auditoria_service


class NombreDuplicadoError(Exception):
    pass


class ProveedorNoEncontradoError(Exception):
    pass


def _a_out(proveedor: Proveedor, conteo: tuple[int, int]) -> ProveedorResumenOut:
    total_productos, pedidos_pendientes = conteo
    return ProveedorResumenOut(
        id=proveedor.id,
        nombre=proveedor.nombre,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        email=proveedor.email,
        clabe=proveedor.clabe,
        activo=proveedor.activo,
        total_productos=total_productos,
        pedidos_pendientes=pedidos_pendientes,
    )


def _a_out_individual(db: Session, proveedor: Proveedor) -> ProveedorResumenOut:
    conteos = proveedor_repository.get_conteos(db, [proveedor.id])
    return _a_out(proveedor, conteos.get(proveedor.id, (0, 0)))


def listar(db: Session, q: str | None, page: int, size: int) -> tuple[list[ProveedorResumenOut], int]:
    proveedores, total = proveedor_repository.get_all(db, q, page, size)
    conteos = proveedor_repository.get_conteos(db, [p.id for p in proveedores])
    items = [_a_out(p, conteos.get(p.id, (0, 0))) for p in proveedores]
    return items, total


def obtener(db: Session, proveedor_id: int) -> ProveedorResumenOut:
    proveedor = proveedor_repository.get_by_id(db, proveedor_id)
    if proveedor is None:
        raise ProveedorNoEncontradoError(proveedor_id)
    return _a_out_individual(db, proveedor)


def crear(
    db: Session,
    usuario_id: int,
    nombre: str,
    contacto: str | None,
    telefono: str | None,
    email: str | None,
    clabe: str | None,
) -> ProveedorResumenOut:
    if proveedor_repository.get_by_nombre(db, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    proveedor = Proveedor(nombre=nombre, contacto=contacto, telefono=telefono, email=email, clabe=clabe)
    try:
        with db.begin_nested():
            proveedor = proveedor_repository.create(db, proveedor)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)
    auditoria_service.registrar(db, usuario_id, "proveedor_creado", "proveedor", proveedor.id, {"nombre": nombre})
    return _a_out(proveedor, (0, 0))


def actualizar(
    db: Session,
    proveedor_id: int,
    nombre: str,
    contacto: str | None,
    telefono: str | None,
    email: str | None,
    clabe: str | None,
) -> ProveedorResumenOut:
    proveedor = proveedor_repository.get_by_id(db, proveedor_id)
    if proveedor is None:
        raise ProveedorNoEncontradoError(proveedor_id)

    existente = proveedor_repository.get_by_nombre(db, nombre)
    if existente is not None and existente.id != proveedor_id:
        raise NombreDuplicadoError(nombre)

    proveedor.nombre = nombre
    proveedor.contacto = contacto
    proveedor.telefono = telefono
    proveedor.email = email
    proveedor.clabe = clabe
    try:
        with db.begin_nested():
            proveedor = proveedor_repository.save(db, proveedor)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)
    return _a_out_individual(db, proveedor)


def cambiar_estado(db: Session, usuario_id: int, proveedor_id: int, activo: bool) -> ProveedorResumenOut:
    proveedor = proveedor_repository.get_by_id(db, proveedor_id)
    if proveedor is None:
        raise ProveedorNoEncontradoError(proveedor_id)
    activo_anterior = proveedor.activo
    proveedor.activo = activo
    proveedor = proveedor_repository.save(db, proveedor)
    if activo_anterior != activo:
        auditoria_service.registrar(
            db,
            usuario_id,
            "proveedor_estado_cambiado",
            "proveedor",
            proveedor.id,
            {"activo_anterior": activo_anterior, "activo_nuevo": activo},
        )
    return _a_out_individual(db, proveedor)
