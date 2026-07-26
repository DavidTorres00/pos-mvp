from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class CajaSesion(Base):
    __tablename__ = "caja_sesiones"

    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    monto_inicial: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    monto_final: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    abierta: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    fecha_apertura: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    fecha_cierre: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
