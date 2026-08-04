from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.proveedor import Proveedor
from app.repositories import proveedor_repository
from app.services import auditoria_service


class NombreDuplicadoError(Exception):
    pass


class ProveedorNoEncontradoError(Exception):
    pass


def listar(db: Session, q: str | None, page: int, size: int) -> tuple[list[Proveedor], int]:
    return proveedor_repository.get_all(db, q, page, size)


def obtener(db: Session, proveedor_id: int) -> Proveedor:
    proveedor = proveedor_repository.get_by_id(db, proveedor_id)
    if proveedor is None:
        raise ProveedorNoEncontradoError(proveedor_id)
    return proveedor


def crear(
    db: Session,
    usuario_id: int,
    nombre: str,
    contacto: str | None,
    telefono: str | None,
    email: str | None,
    clabe: str | None,
) -> Proveedor:
    if proveedor_repository.get_by_nombre(db, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    proveedor = Proveedor(nombre=nombre, contacto=contacto, telefono=telefono, email=email, clabe=clabe)
    try:
        with db.begin_nested():
            proveedor = proveedor_repository.create(db, proveedor)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)
    auditoria_service.registrar(db, usuario_id, "proveedor_creado", "proveedor", proveedor.id, {"nombre": nombre})
    return proveedor


def actualizar(
    db: Session,
    proveedor_id: int,
    nombre: str,
    contacto: str | None,
    telefono: str | None,
    email: str | None,
    clabe: str | None,
) -> Proveedor:
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
            return proveedor_repository.save(db, proveedor)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)


def cambiar_estado(db: Session, usuario_id: int, proveedor_id: int, activo: bool) -> Proveedor:
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
    return proveedor
