from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.usuario import RolUsuario, Usuario
from app.repositories import usuario_repository
from app.schemas.usuario import UsuarioOut
from app.services import auditoria_service


class UsuarioNoEncontradoError(Exception):
    pass


class EmailDuplicadoError(Exception):
    pass


def listar(db: Session, page: int, size: int) -> tuple[list[UsuarioOut], int]:
    usuarios, total = usuario_repository.get_all(db, page, size)
    return [UsuarioOut.model_validate(u) for u in usuarios], total


def crear(db: Session, actor_id: int, email: str, nombre: str, password: str, sucursal_id: int) -> Usuario:
    if usuario_repository.get_by_email(db, email) is not None:
        raise EmailDuplicadoError(email)
    usuario = Usuario(
        email=email,
        nombre=nombre,
        password_hash=hash_password(password),
        role=RolUsuario.CAJERO,
        activo=True,
        sucursal_id=sucursal_id,
    )
    usuario = usuario_repository.create(db, usuario)
    auditoria_service.registrar(db, actor_id, "usuario_creado", "usuario", usuario.id, {"email": email})
    return usuario


def actualizar_nombre(db: Session, actor_id: int, usuario_id: int, nombre: str) -> Usuario:
    usuario = usuario_repository.get_by_id(db, usuario_id)
    if usuario is None:
        raise UsuarioNoEncontradoError(usuario_id)
    anterior = usuario.nombre
    usuario.nombre = nombre
    usuario = usuario_repository.save(db, usuario)
    if anterior != nombre:
        auditoria_service.registrar(
            db, actor_id, "usuario_nombre_cambiado", "usuario", usuario.id, {"nombre_anterior": anterior, "nombre_nuevo": nombre}
        )
    return usuario


def actualizar_permisos(
    db: Session,
    actor_id: int,
    usuario_id: int,
    puede_retirar_excedente: bool | None,
    puede_hacer_devoluciones: bool | None,
) -> Usuario:
    usuario = usuario_repository.get_by_id(db, usuario_id)
    if usuario is None:
        raise UsuarioNoEncontradoError(usuario_id)

    cambios: dict[str, bool] = {}
    if puede_retirar_excedente is not None and puede_retirar_excedente != usuario.puede_retirar_excedente:
        cambios["puede_retirar_excedente_anterior"] = usuario.puede_retirar_excedente
        cambios["puede_retirar_excedente_nuevo"] = puede_retirar_excedente
        usuario.puede_retirar_excedente = puede_retirar_excedente
    if puede_hacer_devoluciones is not None and puede_hacer_devoluciones != usuario.puede_hacer_devoluciones:
        cambios["puede_hacer_devoluciones_anterior"] = usuario.puede_hacer_devoluciones
        cambios["puede_hacer_devoluciones_nuevo"] = puede_hacer_devoluciones
        usuario.puede_hacer_devoluciones = puede_hacer_devoluciones

    usuario = usuario_repository.save(db, usuario)
    if cambios:
        auditoria_service.registrar(db, actor_id, "usuario_permisos_cambiados", "usuario", usuario.id, cambios)
    return usuario
