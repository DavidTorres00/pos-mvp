from sqlalchemy.orm import Session

from app.core.security import create_access_token, generate_csrf_token, verify_password
from app.models.usuario import Usuario
from app.repositories import caja_repository, usuario_repository
from app.services import auditoria_service


class CajaAbiertaPropiaError(Exception):
    pass


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


def cerrar_sesion(db: Session, usuario: Usuario) -> None:
    """Cierra la sesión de un usuario. Si tiene la caja abierta a su propio nombre, rechaza
    el logout: debe hacer el corte de caja antes de irse, para que el siguiente cajero
    empiece limpio con su propio monto_inicial."""
    if caja_repository.get_abierta_by_usuario(db, usuario.id) is not None:
        raise CajaAbiertaPropiaError()
    auditoria_service.registrar(db, usuario.id, "logout", "usuario", usuario.id)
