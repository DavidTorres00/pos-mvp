from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.categoria import Categoria


class Subcategoria(Base):
    __tablename__ = "subcategorias"
    __table_args__ = (
        UniqueConstraint("categoria_id", "codigo", name="uq_subcategorias_categoria_codigo"),
        UniqueConstraint("categoria_id", "nombre", name="uq_subcategorias_categoria_nombre"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    codigo: Mapped[str] = mapped_column(String(2), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False)
    categoria: Mapped[Categoria] = relationship(lazy="joined")
