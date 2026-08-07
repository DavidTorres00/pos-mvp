from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.categoria import Categoria
from app.repositories import categoria_repository, configuracion_repository
from app.schemas.categoria import CategoriaResumenOut


class NombreDuplicadoError(Exception):
    pass


class CategoriaNoEncontradaError(Exception):
    pass


def _a_out(
    categoria: Categoria, conteo: tuple[int, int], conteo_alerta: tuple[int, int] = (0, 0)
) -> CategoriaResumenOut:
    total_subcategorias, total_productos = conteo
    productos_sin_stock, productos_stock_bajo = conteo_alerta
    return CategoriaResumenOut(
        id=categoria.id,
        nombre=categoria.nombre,
        codigo=categoria.codigo,
        activo=categoria.activo,
        total_subcategorias=total_subcategorias,
        total_productos=total_productos,
        productos_sin_stock=productos_sin_stock,
        productos_stock_bajo=productos_stock_bajo,
    )


def _a_out_individual(db: Session, categoria: Categoria) -> CategoriaResumenOut:
    conteos = categoria_repository.get_conteos(db, [categoria.id])
    return _a_out(categoria, conteos.get(categoria.id, (0, 0)))


def listar(
    db: Session, q: str | None, sucursal_id: int | None, page: int, size: int
) -> tuple[list[CategoriaResumenOut], int]:
    categorias, total = categoria_repository.get_all(db, q, page, size)
    categoria_ids = [c.id for c in categorias]
    conteos = categoria_repository.get_conteos(db, categoria_ids)
    # sucursal_id es opcional (el picker de categoría en ProductoForm no la manda, no necesita
    # saber de alertas) — sin ella, ningún conteo de alerta, no se adivina una sucursal.
    conteos_alerta: dict[int, tuple[int, int]] = {}
    if sucursal_id is not None:
        umbral_stock_bajo = configuracion_repository.get(db).umbral_stock_bajo_default
        conteos_alerta = categoria_repository.get_conteos_alerta_stock(db, categoria_ids, sucursal_id, umbral_stock_bajo)
    items = [_a_out(c, conteos.get(c.id, (0, 0)), conteos_alerta.get(c.id, (0, 0))) for c in categorias]
    return items, total


def obtener(db: Session, categoria_id: int) -> CategoriaResumenOut:
    categoria = categoria_repository.get_by_id(db, categoria_id)
    if categoria is None:
        raise CategoriaNoEncontradaError(categoria_id)
    return _a_out_individual(db, categoria)


def _siguiente_codigo(db: Session) -> str:
    max_codigo = categoria_repository.get_max_codigo(db)
    return f"{(int(max_codigo) + 1) if max_codigo else 1:02d}"


def crear(db: Session, nombre: str) -> CategoriaResumenOut:
    if categoria_repository.get_by_nombre(db, nombre) is not None:
        raise NombreDuplicadoError(nombre)
    try:
        with db.begin_nested():
            codigo = _siguiente_codigo(db)
            categoria = categoria_repository.create(db, Categoria(nombre=nombre, codigo=codigo))
    except IntegrityError:
        raise NombreDuplicadoError(nombre)
    return _a_out(categoria, (0, 0))


def actualizar(db: Session, categoria_id: int, nombre: str) -> CategoriaResumenOut:
    categoria = categoria_repository.get_by_id(db, categoria_id)
    if categoria is None:
        raise CategoriaNoEncontradaError(categoria_id)

    existente = categoria_repository.get_by_nombre(db, nombre)
    if existente is not None and existente.id != categoria_id:
        raise NombreDuplicadoError(nombre)

    categoria.nombre = nombre
    try:
        with db.begin_nested():
            categoria = categoria_repository.save(db, categoria)
    except IntegrityError:
        raise NombreDuplicadoError(nombre)
    return _a_out_individual(db, categoria)


def cambiar_estado(db: Session, categoria_id: int, activo: bool) -> CategoriaResumenOut:
    categoria = categoria_repository.get_by_id(db, categoria_id)
    if categoria is None:
        raise CategoriaNoEncontradaError(categoria_id)
    categoria.activo = activo
    categoria = categoria_repository.save(db, categoria)
    return _a_out_individual(db, categoria)
