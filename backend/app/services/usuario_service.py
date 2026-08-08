from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.usuario import RolUsuario, Usuario
from app.repositories import caja_repository, usuario_repository
from app.schemas.usuario import UsuarioOut
from app.services import auditoria_service


class UsuarioNoEncontradoError(Exception):
    pass


class EmailDuplicadoError(Exception):
    pass


class CajaAbiertaError(Exception):
    """El cajero tiene una caja abierta — cambiarlo de sucursal o desactivarlo a medio turno
    dejaría dinero/inventario en el aire (ver docs/BACKEND.md). El admin debe cerrarla primero
    (corte de emergencia si el cajero no puede hacerlo él mismo, ver caja_service.cerrar)."""

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


def actualizar(
    db: Session,
    actor_id: int,
    usuario_id: int,
    nombre: str | None,
    email: str | None,
    sucursal_id: int | None,
    activo: bool | None,
) -> Usuario:
    """Edición consolidada del cajero (nombre/email/sucursal/estado) — un solo evento de
    auditoría con el diff real de lo que cambió, en vez de un endpoint por campo. Excluye
    `puede_retirar_excedente`/`puede_hacer_devoluciones` (siguen en `actualizar_permisos`, son
    switches de la tabla, no parte de este diálogo) y la contraseña (`resetear_password`, acción
    aparte y sensible, nunca silenciosa dentro de una edición general)."""
    usuario = usuario_repository.get_by_id(db, usuario_id)
    if usuario is None:
        raise UsuarioNoEncontradoError(usuario_id)

    cambia_sucursal = sucursal_id is not None and sucursal_id != usuario.sucursal_id
    desactiva = activo is False and usuario.activo is True
    if (cambia_sucursal or desactiva) and caja_repository.get_abierta_by_usuario(db, usuario_id) is not None:
        raise CajaAbiertaError()

    cambios: dict[str, dict[str, object]] = {}
    if nombre is not None and nombre != usuario.nombre:
        cambios["nombre"] = {"anterior": usuario.nombre, "nuevo": nombre}
        usuario.nombre = nombre
    if email is not None and email != usuario.email:
        if usuario_repository.get_by_email(db, email) is not None:
            raise EmailDuplicadoError(email)
        cambios["email"] = {"anterior": usuario.email, "nuevo": email}
        usuario.email = email
    if cambia_sucursal:
        cambios["sucursal_id"] = {"anterior": usuario.sucursal_id, "nuevo": sucursal_id}
        usuario.sucursal_id = sucursal_id
    if activo is not None and activo != usuario.activo:
        cambios["activo"] = {"anterior": usuario.activo, "nuevo": activo}
        usuario.activo = activo

    usuario = usuario_repository.save(db, usuario)
    if cambios:
        auditoria_service.registrar(db, actor_id, "usuario_actualizado", "usuario", usuario.id, cambios)
    return usuario


def resetear_password(db: Session, actor_id: int, usuario_id: int, password: str) -> Usuario:
    usuario = usuario_repository.get_by_id(db, usuario_id)
    if usuario is None:
        raise UsuarioNoEncontradoError(usuario_id)
    usuario.password_hash = hash_password(password)
    usuario = usuario_repository.save(db, usuario)
    # sin el password en el detalle, ni hasheado — el evento en sí ya es la señal que importa
    auditoria_service.registrar(db, actor_id, "usuario_password_reseteada", "usuario", usuario.id)
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
