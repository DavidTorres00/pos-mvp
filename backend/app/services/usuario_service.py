from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.usuario import RolUsuario, Usuario
from app.repositories import usuario_repository
from app.services import auditoria_service


class UsuarioNoEncontradoError(Exception):
    pass


class EmailDuplicadoError(Exception):
    pass


def listar(db: Session, page: int, size: int) -> tuple[list[Usuario], int]:
    return usuario_repository.get_all(db, page, size)


def crear(db: Session, actor_id: int, email: str, nombre: str, password: str) -> Usuario:
    if usuario_repository.get_by_email(db, email) is not None:
        raise EmailDuplicadoError(email)
    usuario = Usuario(
        email=email,
        nombre=nombre,
        password_hash=hash_password(password),
        role=RolUsuario.CAJERO,
        activo=True,
    )
    usuario = usuario_repository.create(db, usuario)
    auditoria_service.registrar(db, actor_id, "usuario_creado", "usuario", usuario.id, {"email": email})
    return usuario


def actualizar_permisos(db: Session, actor_id: int, usuario_id: int, puede_retirar_excedente: bool) -> Usuario:
    usuario = usuario_repository.get_by_id(db, usuario_id)
    if usuario is None:
        raise UsuarioNoEncontradoError(usuario_id)
    anterior = usuario.puede_retirar_excedente
    usuario.puede_retirar_excedente = puede_retirar_excedente
    usuario = usuario_repository.save(db, usuario)
    if anterior != puede_retirar_excedente:
        auditoria_service.registrar(
            db,
            actor_id,
            "usuario_permisos_cambiados",
            "usuario",
            usuario.id,
            {"puede_retirar_excedente_anterior": anterior, "puede_retirar_excedente_nuevo": puede_retirar_excedente},
        )
    return usuario
