from sqlalchemy.orm import Session

from app.models.configuracion_negocio import ConfiguracionNegocio
from app.repositories import configuracion_repository, equipo_repository
from app.services import auditoria_service


def obtener(db: Session) -> tuple[ConfiguracionNegocio, int]:
    return configuracion_repository.get(db), equipo_repository.contar_activos(db)


def actualizar(db: Session, usuario_id: int, limite_equipos: int | None) -> tuple[ConfiguracionNegocio, int]:
    configuracion = configuracion_repository.get(db)
    anterior = configuracion.limite_equipos
    configuracion.limite_equipos = limite_equipos
    configuracion = configuracion_repository.save(db, configuracion)
    auditoria_service.registrar(
        db,
        usuario_id,
        "plan_actualizado",
        "configuracion_negocio",
        configuracion.id,
        {"anterior": anterior, "nuevo": limite_equipos},
    )
    return configuracion, equipo_repository.contar_activos(db)
