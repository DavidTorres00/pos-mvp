from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Sucursal(Base):
    __tablename__ = "sucursales"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    direccion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    responsable: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(32), nullable=True)
    # override propio del límite de efectivo por caja; nulo = usa el default global de
    # configuracion_negocio.limite_efectivo_caja (algunas sucursales lo necesitan, otras no)
    limite_efectivo_caja: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
