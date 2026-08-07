from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.configuracion_negocio import ConfiguracionNegocio
from app.repositories import configuracion_repository
from app.services import auditoria_service


def obtener(db: Session) -> ConfiguracionNegocio:
    return configuracion_repository.get(db)


def actualizar(
    db: Session,
    usuario_id: int,
    limite_efectivo_caja: Decimal | None,
    umbral_stock_bajo_default: int | None,
) -> ConfiguracionNegocio:
    configuracion = configuracion_repository.get(db)
    anterior = {
        "limite_efectivo_caja": configuracion.limite_efectivo_caja,
        "umbral_stock_bajo_default": configuracion.umbral_stock_bajo_default,
    }
    configuracion.limite_efectivo_caja = limite_efectivo_caja
    configuracion.umbral_stock_bajo_default = umbral_stock_bajo_default
    configuracion = configuracion_repository.save(db, configuracion)
    auditoria_service.registrar(
        db,
        usuario_id,
        "configuracion_actualizada",
        "configuracion_negocio",
        configuracion.id,
        {
            "anterior": {k: str(v) if v is not None else None for k, v in anterior.items()},
            "nuevo": {
                "limite_efectivo_caja": str(limite_efectivo_caja) if limite_efectivo_caja is not None else None,
                "umbral_stock_bajo_default": str(umbral_stock_bajo_default)
                if umbral_stock_bajo_default is not None
                else None,
            },
        },
    )
    return configuracion
