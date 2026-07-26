from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.detalle_compra import DetalleCompra


class Compra(Base):
    __tablename__ = "compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["DetalleCompra"]] = relationship(back_populates="compra", lazy="selectin")
