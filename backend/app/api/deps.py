from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import ACCESS_TOKEN_COOKIE_NAME, decode_access_token
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.repositories import usuario_repository


def resolver_usuario_desde_cookie(db: Session, request: Request) -> Usuario | None:
    """Núcleo de la autenticación por cookie, separado de `get_current_user` para que un
    endpoint de vida larga (streaming) pueda usarlo con una sesión propia de corta duración en
    vez de la sesión atada a `Depends(get_db)` — esa vive tanto como dure la respuesta completa,
    que en un stream es indefinido (ver `caja/router.py:eventos`, docs/BACKEND.md)."""
    token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
    if token is None:
        return None
    email = decode_access_token(token)
    if email is None:
        return None
    usuario = usuario_repository.get_by_email(db, email)
    if usuario is None or not usuario.activo:
        return None
    return usuario


def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    usuario = resolver_usuario_desde_cookie(db, request)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o expiradas",
        )
    return usuario


def require_role(*roles: RolUsuario) -> Callable[[Usuario], Usuario]:
    def dependency(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tenés permiso para realizar esta acción",
            )
        return usuario

    return dependency


def resolve_sucursal_id(sucursal_id: int | None = None, usuario: Usuario = Depends(get_current_user)) -> int:
    """Sucursal efectiva para pantallas que muestran/mutan stock (Productos, Inventario, Compras).
    El cajero siempre usa la suya propia (ignora cualquier valor recibido); el admin no pertenece
    a ninguna, así que debe pasarla explícitamente."""
    if usuario.sucursal_id is not None:
        return usuario.sucursal_id
    if sucursal_id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Selecciona una sucursal")
    return sucursal_id
