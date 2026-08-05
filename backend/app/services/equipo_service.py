from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.repositories import equipo_repository


class NombreDuplicadoError(Exception):
    pass


class EquipoNoEncontradoError(Exception):
    pass


def listar(db: Session, sucursal_id: int | None, page: int, size: int) -> tuple[list[Equipo], int]:
    return equipo_repository.get_all(db, sucursal_id, page, size)


def crear(db: Session, sucursal_id: int, nombre: str) -> Equipo:
    if equipo_repository.get_by_nombre(db, sucursal_id, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    equipo = Equipo(sucursal_id=sucursal_id, nombre=nombre)
    try:
        with db.begin_nested():
            return equipo_repository.create(db, equipo)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)


def actualizar(db: Session, equipo_id: int, nombre: str) -> Equipo:
    equipo = equipo_repository.get_by_id(db, equipo_id)
    if equipo is None:
        raise EquipoNoEncontradoError(equipo_id)

    existente = equipo_repository.get_by_nombre(db, equipo.sucursal_id, nombre)
    if existente is not None and existente.id != equipo_id:
        raise NombreDuplicadoError(nombre)

    equipo.nombre = nombre
    try:
        with db.begin_nested():
            return equipo_repository.save(db, equipo)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)


def cambiar_estado(db: Session, equipo_id: int, activo: bool) -> Equipo:
    equipo = equipo_repository.get_by_id(db, equipo_id)
    if equipo is None:
        raise EquipoNoEncontradoError(equipo_id)
    equipo.activo = activo
    return equipo_repository.save(db, equipo)
