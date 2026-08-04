from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

CONFIGURACION_NEGOCIO_ID = 1


class ConfiguracionNegocio(Base):
    """Fila única (id fijo) con parámetros de negocio editables por el admin en runtime, sin
    redeploy: límite de efectivo por caja, topes de gasto de OpenPay. No es config de
    despliegue (eso vive en Settings/.env)."""

    __tablename__ = "configuracion_negocio"

    id: Mapped[int] = mapped_column(primary_key=True)
    limite_efectivo_caja: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    openpay_tope_por_orden: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    openpay_tope_diario: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
