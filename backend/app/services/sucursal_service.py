from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.sucursal import Sucursal
from app.repositories import sucursal_repository
from app.services import auditoria_service


class NombreDuplicadoError(Exception):
    pass


class SucursalNoEncontradaError(Exception):
    pass


def listar(db: Session, q: str | None, page: int, size: int) -> tuple[list[Sucursal], int]:
    return sucursal_repository.get_all(db, q, page, size)


def obtener(db: Session, sucursal_id: int) -> Sucursal:
    sucursal = sucursal_repository.get_by_id(db, sucursal_id)
    if sucursal is None:
        raise SucursalNoEncontradaError(sucursal_id)
    return sucursal


def crear(db: Session, usuario_id: int, nombre: str) -> Sucursal:
    if sucursal_repository.get_by_nombre(db, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    sucursal = Sucursal(nombre=nombre)
    try:
        with db.begin_nested():
            sucursal = sucursal_repository.create(db, sucursal)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)
    auditoria_service.registrar(db, usuario_id, "sucursal_creada", "sucursal", sucursal.id, {"nombre": nombre})
    return sucursal


def actualizar(db: Session, sucursal_id: int, nombre: str) -> Sucursal:
    sucursal = sucursal_repository.get_by_id(db, sucursal_id)
    if sucursal is None:
        raise SucursalNoEncontradaError(sucursal_id)

    existente = sucursal_repository.get_by_nombre(db, nombre)
    if existente is not None and existente.id != sucursal_id:
        raise NombreDuplicadoError(nombre)

    sucursal.nombre = nombre
    try:
        with db.begin_nested():
            return sucursal_repository.save(db, sucursal)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)


def cambiar_estado(db: Session, usuario_id: int, sucursal_id: int, activo: bool) -> Sucursal:
    sucursal = sucursal_repository.get_by_id(db, sucursal_id)
    if sucursal is None:
        raise SucursalNoEncontradaError(sucursal_id)
    activo_anterior = sucursal.activo
    sucursal.activo = activo
    sucursal = sucursal_repository.save(db, sucursal)
    if activo_anterior != activo:
        auditoria_service.registrar(
            db,
            usuario_id,
            "sucursal_estado_cambiado",
            "sucursal",
            sucursal.id,
            {"activo_anterior": activo_anterior, "activo_nuevo": activo},
        )
    return sucursal
