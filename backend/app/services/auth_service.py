from sqlalchemy.orm import Session

from app.core.security import create_access_token, generate_csrf_token, verify_password
from app.models.usuario import Usuario
from app.repositories import usuario_repository


def authenticate(db: Session, email: str, password: str) -> Usuario | None:
    usuario = usuario_repository.get_by_email(db, email)
    if usuario is None or not usuario.activo:
        return None
    if not verify_password(password, usuario.password_hash):
        return None
    return usuario


def iniciar_sesion(usuario: Usuario) -> tuple[str, str]:
    """Emite los tokens de sesión (access token JWT + token CSRF) para un usuario ya autenticado."""
    access_token = create_access_token(subject=usuario.email)
    csrf_token = generate_csrf_token()
    return access_token, csrf_token
