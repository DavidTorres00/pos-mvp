from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.equipo import Equipo
from app.repositories import configuracion_repository, equipo_repository


class NombreDuplicadoError(Exception):
    pass


class EquipoNoEncontradoError(Exception):
    pass


class LimiteEquiposAlcanzadoError(Exception):
    def __init__(self, limite: int):
        self.limite = limite


def _validar_cupo(db: Session) -> None:
    """Cupo comercial de hardware (impresora/lector/caja registradora) vendido a esta
    instalación — lo fija el superuser, nunca el admin del negocio (ver docs/BACKEND.md). Se
    revisa tanto al dar de alta un equipo nuevo como al reactivar uno inactivo, para que apagar
    y prender un equipo existente no sea una forma de esquivar el tope."""
    limite = configuracion_repository.get(db).limite_equipos
    if limite is not None and equipo_repository.contar_activos(db) >= limite:
        raise LimiteEquiposAlcanzadoError(limite)


def listar(db: Session, sucursal_id: int | None, page: int, size: int) -> tuple[list[Equipo], int]:
    return equipo_repository.get_all(db, sucursal_id, page, size)


def crear(db: Session, sucursal_id: int, nombre: str) -> Equipo:
    if equipo_repository.get_by_nombre(db, sucursal_id, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    _validar_cupo(db)
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
    if activo and not equipo.activo:
        _validar_cupo(db)
    equipo.activo = activo
    return equipo_repository.save(db, equipo)
