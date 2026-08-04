from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario
from app.repositories.pagination import paginar


def get_by_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email))


def get_by_id(db: Session, usuario_id: int) -> Usuario | None:
    return db.get(Usuario, usuario_id)


def get_all(db: Session, page: int, size: int) -> tuple[list[Usuario], int]:
    stmt = select(Usuario).order_by(Usuario.nombre)
    return paginar(db, stmt, page, size)


def save(db: Session, usuario: Usuario) -> Usuario:
    db.flush()
    return usuario
