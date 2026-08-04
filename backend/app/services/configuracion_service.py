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
    openpay_tope_por_orden: Decimal | None,
    openpay_tope_diario: Decimal | None,
) -> ConfiguracionNegocio:
    configuracion = configuracion_repository.get(db)
    anterior = {
        "limite_efectivo_caja": configuracion.limite_efectivo_caja,
        "openpay_tope_por_orden": configuracion.openpay_tope_por_orden,
        "openpay_tope_diario": configuracion.openpay_tope_diario,
    }
    configuracion.limite_efectivo_caja = limite_efectivo_caja
    configuracion.openpay_tope_por_orden = openpay_tope_por_orden
    configuracion.openpay_tope_diario = openpay_tope_diario
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
                "openpay_tope_por_orden": str(openpay_tope_por_orden) if openpay_tope_por_orden is not None else None,
                "openpay_tope_diario": str(openpay_tope_diario) if openpay_tope_diario is not None else None,
            },
        },
    )
    return configuracion
