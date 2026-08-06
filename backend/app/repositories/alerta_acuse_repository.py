from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.alerta_acuse import AlertaAcuse


def get_referencias_acusadas(db: Session, tipo: str) -> set[int]:
    stmt = select(AlertaAcuse.referencia_id).where(AlertaAcuse.tipo == tipo)
    return set(db.scalars(stmt))


def crear(db: Session, tipo: str, referencia_id: int, usuario_id: int) -> AlertaAcuse:
    acuse = AlertaAcuse(tipo=tipo, referencia_id=referencia_id, usuario_id=usuario_id)
    try:
        with db.begin_nested():
            db.add(acuse)
            db.flush()
    except IntegrityError:
        # ya estaba acusada (doble clic, o dos admins a la vez) — idempotente, no es un error real
        pass
    return acuse
