from pydantic import BaseModel, ConfigDict


class CategoriaCreate(BaseModel):
    nombre: str


class CategoriaUpdate(BaseModel):
    nombre: str


class CategoriaEstado(BaseModel):
    activo: bool


class CategoriaOut(BaseModel):
    """Catálogo puro — es el que va embebido en ProductoOut.categoria/SubcategoriaOut.categoria
    (ventas, compras, movimientos, etc.). Sin conteos: esos endpoints nunca los calculan, y
    agregarlos aquí rompería la serialización en todos ellos."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    codigo: str
    activo: bool


class CategoriaResumenOut(CategoriaOut):
    """CategoriaOut + conteos — solo para el listado/detalle de /categorias (hub de Productos,
    ver docs/FRONTEND.md). Mismo patrón que ProductoOut/ProductoStockOut: no se le agregan
    conteos al schema base, se reagregan en un schema aparte para el caso que sí los necesita."""

    total_subcategorias: int
    total_productos: int
    # ambos solo tienen sentido si el llamador manda sucursal_id (ver categoria_service.listar)
    # — sin eso, 0 siempre, nunca es un "sin alertas" real.
    productos_sin_stock: int
    productos_stock_bajo: int
