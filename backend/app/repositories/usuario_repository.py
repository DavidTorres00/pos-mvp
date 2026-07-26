from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.usuario import Usuario


def get_by_email(db: Session, email: str) -> Usuario | None:
    return db.scalar(select(Usuario).where(Usuario.email == email))
