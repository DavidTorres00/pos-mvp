from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.models.auditoria import Auditoria
from app.repositories import auditoria_repository


def registrar(
    db: Session,
    usuario_id: int | None,
    accion: str,
    entidad: str,
    entidad_id: int | None = None,
    detalle: dict[str, Any] | None = None,
) -> Auditoria:
    """Registra un evento dentro de la transacción de la request actual: se confirma o se
    revierte junto con el resto de la operación (comportamiento correcto para mutaciones
    normales, ej. cambio de precio)."""
    evento = Auditoria(
        usuario_id=usuario_id, accion=accion, entidad=entidad, entidad_id=entidad_id, detalle=detalle
    )
    return auditoria_repository.create(db, evento)


def registrar_evento_independiente(
    usuario_id: int | None,
    accion: str,
    entidad: str,
    entidad_id: int | None = None,
    detalle: dict[str, Any] | None = None,
) -> None:
    """Registra un evento con su propia sesión y commit inmediato, sin depender de la
    transacción de la request. Necesario para eventos como login fallido: la request
    siempre termina en HTTPException (401), lo que revertiría la transacción ambiente y
    con ella el propio registro que se quiere conservar."""
    db = SessionLocal()
    try:
        db.add(
            Auditoria(usuario_id=usuario_id, accion=accion, entidad=entidad, entidad_id=entidad_id, detalle=detalle)
        )
        db.commit()
    finally:
        db.close()


def listar(
    db: Session,
    usuario_id: int | None,
    entidad: str | None,
    desde: datetime | None,
    hasta: datetime | None,
    page: int,
    size: int,
) -> tuple[list[Auditoria], int]:
    return auditoria_repository.get_all(db, usuario_id, entidad, desde, hasta, page, size)
