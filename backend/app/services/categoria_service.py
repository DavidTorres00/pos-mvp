from sqlalchemy.orm import Session

from app.models.categoria import Categoria
from app.repositories import categoria_repository


class NombreDuplicadoError(Exception):
    pass


class CategoriaNoEncontradaError(Exception):
    pass


def listar(db: Session, q: str | None = None) -> list[Categoria]:
    return categoria_repository.get_all(db, q)


def obtener(db: Session, categoria_id: int) -> Categoria:
    categoria = categoria_repository.get_by_id(db, categoria_id)
    if categoria is None:
        raise CategoriaNoEncontradaError(categoria_id)
    return categoria


def crear(db: Session, nombre: str) -> Categoria:
    if categoria_repository.get_by_nombre(db, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    return categoria_repository.create(db, Categoria(nombre=nombre))


def actualizar(db: Session, categoria_id: int, nombre: str) -> Categoria:
    categoria = categoria_repository.get_by_id(db, categoria_id)
    if categoria is None:
        raise CategoriaNoEncontradaError(categoria_id)

    existente = categoria_repository.get_by_nombre(db, nombre)
    if existente is not None and existente.id != categoria_id:
        raise NombreDuplicadoError(nombre)

    categoria.nombre = nombre
    return categoria_repository.save(db, categoria)


def cambiar_estado(db: Session, categoria_id: int, activo: bool) -> Categoria:
    categoria = categoria_repository.get_by_id(db, categoria_id)
    if categoria is None:
        raise CategoriaNoEncontradaError(categoria_id)
    categoria.activo = activo
    return categoria_repository.save(db, categoria)
