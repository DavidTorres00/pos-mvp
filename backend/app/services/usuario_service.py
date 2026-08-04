from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.repositories import usuario_repository
from app.services import auditoria_service


class UsuarioNoEncontradoError(Exception):
    pass


def listar(db: Session, page: int, size: int) -> tuple[list[Usuario], int]:
    return usuario_repository.get_all(db, page, size)


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
