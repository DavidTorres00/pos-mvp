from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.subcategoria import Subcategoria
from app.repositories import categoria_repository, subcategoria_repository


class NombreDuplicadoError(Exception):
    pass


class SubcategoriaNoEncontradaError(Exception):
    pass


class CategoriaInvalidaError(Exception):
    pass


def listar(db: Session, categoria_id: int | None, page: int, size: int) -> tuple[list[Subcategoria], int]:
    return subcategoria_repository.get_all(db, categoria_id, page, size)


def _siguiente_codigo(db: Session, categoria_id: int) -> str:
    max_codigo = subcategoria_repository.get_max_codigo(db, categoria_id)
    return f"{(int(max_codigo) + 1) if max_codigo else 1:02d}"


def crear(db: Session, categoria_id: int, nombre: str) -> Subcategoria:
    if categoria_repository.get_by_id(db, categoria_id) is None:
        raise CategoriaInvalidaError(categoria_id)
    if subcategoria_repository.get_by_nombre(db, categoria_id, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    try:
        with db.begin_nested():
            codigo = _siguiente_codigo(db, categoria_id)
            subcategoria = Subcategoria(nombre=nombre, codigo=codigo, categoria_id=categoria_id)
            return subcategoria_repository.create(db, subcategoria)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)


def actualizar(db: Session, subcategoria_id: int, nombre: str) -> Subcategoria:
    subcategoria = subcategoria_repository.get_by_id(db, subcategoria_id)
    if subcategoria is None:
        raise SubcategoriaNoEncontradaError(subcategoria_id)

    existente = subcategoria_repository.get_by_nombre(db, subcategoria.categoria_id, nombre)
    if existente is not None and existente.id != subcategoria_id:
        raise NombreDuplicadoError(nombre)

    subcategoria.nombre = nombre
    try:
        with db.begin_nested():
            return subcategoria_repository.save(db, subcategoria)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)


def cambiar_estado(db: Session, subcategoria_id: int, activo: bool) -> Subcategoria:
    subcategoria = subcategoria_repository.get_by_id(db, subcategoria_id)
    if subcategoria is None:
        raise SubcategoriaNoEncontradaError(subcategoria_id)
    subcategoria.activo = activo
    return subcategoria_repository.save(db, subcategoria)
