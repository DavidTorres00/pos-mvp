from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.plan import PlanOut, PlanUpdate
from app.services import plan_service

router = APIRouter(
    prefix="/superadmin", tags=["superadmin"], dependencies=[Depends(require_role(RolUsuario.SUPERUSER))]
)


@router.get("/plan", response_model=PlanOut)
def obtener(db: Session = Depends(get_db)) -> PlanOut:
    configuracion, equipos_activos = plan_service.obtener(db)
    return PlanOut(
        limite_equipos=configuracion.limite_equipos,
        equipos_activos=equipos_activos,
        updated_at=configuracion.updated_at,
    )


@router.put("/plan", response_model=PlanOut)
def actualizar(
    payload: PlanUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.SUPERUSER)),
) -> PlanOut:
    configuracion, equipos_activos = plan_service.actualizar(db, usuario.id, payload.limite_equipos)
    return PlanOut(
        limite_equipos=configuracion.limite_equipos,
        equipos_activos=equipos_activos,
        updated_at=configuracion.updated_at,
    )
