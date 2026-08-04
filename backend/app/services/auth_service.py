from sqlalchemy.orm import Session

from app.core.security import create_access_token, generate_csrf_token, verify_password
from app.models.usuario import Usuario
from app.repositories import usuario_repository
from app.services import auditoria_service


def authenticate(db: Session, email: str, password: str) -> Usuario | None:
    usuario = usuario_repository.get_by_email(db, email)
    if usuario is None or not usuario.activo or not verify_password(password, usuario.password_hash):
        # sesión independiente: el router siempre responde 401 en este caso, lo que
        # revertiría la transacción ambiente y con ella el registro de auditoría
        auditoria_service.registrar_evento_independiente(
            usuario_id=usuario.id if usuario is not None else None,
            accion="login_fallido",
            entidad="usuario",
            entidad_id=usuario.id if usuario is not None else None,
            detalle={"email": email},
        )
        return None
    auditoria_service.registrar(db, usuario.id, "login_exitoso", "usuario", usuario.id)
    return usuario


def iniciar_sesion(usuario: Usuario) -> tuple[str, str]:
    """Emite los tokens de sesión (access token JWT + token CSRF) para un usuario ya autenticado."""
    access_token = create_access_token(subject=usuario.email)
    csrf_token = generate_csrf_token()
    return access_token, csrf_token
