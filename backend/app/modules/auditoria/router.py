from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.database.session import get_db
from app.models.usuario import RolUsuario
from app.schemas.auditoria import AuditoriaOut
from app.schemas.pagination import Pagina
from app.services import auditoria_service

router = APIRouter(prefix="/auditoria", tags=["auditoria"], dependencies=[Depends(require_role(RolUsuario.ADMIN))])


@router.get("", response_model=Pagina[AuditoriaOut])
def listar(
    usuario_id: int | None = None,
    entidad: str | None = None,
    desde: datetime | None = None,
    hasta: datetime | None = None,
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion),
    db: Session = Depends(get_db),
) -> Pagina[AuditoriaOut]:
    items, total = auditoria_service.listar(db, usuario_id, entidad, desde, hasta, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)
