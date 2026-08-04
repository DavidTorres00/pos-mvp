from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.api.pagination import ParametrosPaginacion, parametros_paginacion
from app.core.config import settings
from app.core.security import ACCESS_TOKEN_COOKIE_NAME, CSRF_COOKIE_NAME
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.schemas.auth import LoginRequest
from app.schemas.pagination import Pagina
from app.schemas.usuario import UsuarioCreate, UsuarioOut, UsuarioPermisosUpdate
from app.services import auth_service, usuario_service
from app.services.usuario_service import EmailDuplicadoError, UsuarioNoEncontradoError

router = APIRouter(prefix="/auth", tags=["auth"])
usuarios_router = APIRouter(
    prefix="/usuarios", tags=["usuarios"], dependencies=[Depends(require_role(RolUsuario.ADMIN))]
)


@router.post("/login", response_model=UsuarioOut)
def login(payload: LoginRequest, response: Response, db: Session = Depends(get_db)) -> Usuario:
    usuario = auth_service.authenticate(db, payload.email, payload.password)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    access_token, csrf_token = auth_service.iniciar_sesion(usuario)
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=access_token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    response.set_cookie(
        key=CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.cookie_secure,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    return usuario


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    response.delete_cookie(ACCESS_TOKEN_COOKIE_NAME, path="/")
    response.delete_cookie(CSRF_COOKIE_NAME, path="/")
    return {"detail": "sesión cerrada"}


@router.get("/me", response_model=UsuarioOut)
def me(usuario: Usuario = Depends(get_current_user)) -> Usuario:
    return usuario


@usuarios_router.get("", response_model=Pagina[UsuarioOut])
def listar(
    paginacion: ParametrosPaginacion = Depends(parametros_paginacion), db: Session = Depends(get_db)
) -> Pagina[UsuarioOut]:
    items, total = usuario_service.listar(db, paginacion.page, paginacion.size)
    return Pagina(items=items, total=total, page=paginacion.page, size=paginacion.size)


@usuarios_router.post("", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> UsuarioOut:
    try:
        return usuario_service.crear(db, usuario.id, payload.email, payload.nombre, payload.password)
    except EmailDuplicadoError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese email ya está registrado")


@usuarios_router.patch("/{usuario_id}/permisos", response_model=UsuarioOut)
def actualizar_permisos(
    usuario_id: int,
    payload: UsuarioPermisosUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> UsuarioOut:
    try:
        return usuario_service.actualizar_permisos(db, usuario.id, usuario_id, payload.puede_retirar_excedente)
    except UsuarioNoEncontradoError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
