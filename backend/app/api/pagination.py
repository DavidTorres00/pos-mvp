from dataclasses import dataclass

from fastapi import Query


@dataclass
class ParametrosPaginacion:
    page: int
    size: int


def parametros_paginacion(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
) -> ParametrosPaginacion:
    return ParametrosPaginacion(page=page, size=size)
