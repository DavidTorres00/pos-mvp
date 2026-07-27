from collections.abc import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import ACCESS_TOKEN_COOKIE_NAME, decode_access_token
from app.database.session import get_db
from app.models.usuario import RolUsuario, Usuario
from app.repositories import usuario_repository


def get_current_user(request: Request, db: Session = Depends(get_db)) -> Usuario:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o expiradas",
    )
    token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
    if token is None:
        raise unauthorized
    email = decode_access_token(token)
    if email is None:
        raise unauthorized
    usuario = usuario_repository.get_by_email(db, email)
    if usuario is None or not usuario.activo:
        raise unauthorized
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
