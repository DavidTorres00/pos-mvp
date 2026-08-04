from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.configuracion_negocio import CONFIGURACION_NEGOCIO_ID, ConfiguracionNegocio


def get(db: Session) -> ConfiguracionNegocio:
    configuracion = db.get(ConfiguracionNegocio, CONFIGURACION_NEGOCIO_ID)
    if configuracion is None:
        raise RuntimeError("Falta la fila de configuracion_negocio: revisar la migración de creación")
    return configuracion


def get_for_update(db: Session) -> ConfiguracionNegocio:
    """Toma el lock de la única fila: al haber solo un registro, esto serializa toda
    aprobación de pago a proveedor entre sí y cierra la carrera del tope diario de gasto
    (dos aprobaciones concurrentes no pueden pasar juntas el chequeo antes de que cualquiera
    haya quedado registrada como pagada)."""
    stmt = (
        select(ConfiguracionNegocio)
        .where(ConfiguracionNegocio.id == CONFIGURACION_NEGOCIO_ID)
        .with_for_update(of=ConfiguracionNegocio)
    )
    configuracion = db.scalar(stmt)
    if configuracion is None:
        raise RuntimeError("Falta la fila de configuracion_negocio: revisar la migración de creación")
    return configuracion


def save(db: Session, configuracion: ConfiguracionNegocio) -> ConfiguracionNegocio:
    db.flush()
    return configuracion
