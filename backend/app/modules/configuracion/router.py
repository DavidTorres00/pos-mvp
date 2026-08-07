from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.configuracion import ConfiguracionNegocioOut, ConfiguracionNegocioUpdate
from app.services import configuracion_service

router = APIRouter(
    prefix="/configuracion", tags=["configuracion"], dependencies=[Depends(require_role(RolUsuario.ADMIN))]
)


@router.get("", response_model=ConfiguracionNegocioOut)
def obtener(db: Session = Depends(get_db)) -> ConfiguracionNegocioOut:
    return configuracion_service.obtener(db)


@router.put("", response_model=ConfiguracionNegocioOut)
def actualizar(
    payload: ConfiguracionNegocioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(require_role(RolUsuario.ADMIN)),
) -> ConfiguracionNegocioOut:
    return configuracion_service.actualizar(
        db,
        usuario.id,
        payload.limite_efectivo_caja,
        payload.umbral_stock_bajo_default,
    )
