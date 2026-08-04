from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.usuario import Usuario


class Auditoria(Base):
    """Registro transversal de 'quién hizo qué': cubre eventos que ningún módulo de dominio
    deja rastro por sí solo (login, cambios de precio/estado, retiros de caja, pagos a
    proveedor, etc.). No reemplaza usuario_id/created_at de cada tabla de dominio, es el
    punto único de consulta para auditoría sin recorrer módulo por módulo."""

    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(primary_key=True)
    # nullable: un login fallido con email inexistente no resuelve a ningún Usuario
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    accion: Mapped[str] = mapped_column(String(64), nullable=False)
    entidad: Mapped[str] = mapped_column(String(64), nullable=False)
    entidad_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detalle: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    usuario: Mapped[Usuario | None] = relationship(lazy="joined")
