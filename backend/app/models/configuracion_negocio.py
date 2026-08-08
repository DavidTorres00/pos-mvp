from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

CONFIGURACION_NEGOCIO_ID = 1


class ConfiguracionNegocio(Base):
    """Fila única (id fijo) con parámetros de negocio editables en runtime, sin redeploy: límite
    de efectivo por caja, umbral de stock bajo (ambos editables por el admin) y límite de equipos
    (editable únicamente por el superuser, ver `limite_equipos` abajo). No es config de despliegue
    (eso vive en Settings/.env). Sin ningún tope de gasto configurable para pagos a proveedor —
    decisión deliberada, ver docs/BACKEND.md: la revisión manual del admin en cada pedido ya es
    el control, una segunda barrera automática es redundante."""

    __tablename__ = "configuracion_negocio"

    id: Mapped[int] = mapped_column(primary_key=True)
    limite_efectivo_caja: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    # nulo = feature apagada: sin este valor no hay umbral con el que comparar el stock bajo.
    # Usado por el reporte de atención del dashboard admin (ver docs/BACKEND.md).
    umbral_stock_bajo_default: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # cupo de equipos (cajas físicas: impresora+lector+terminal) habilitados para esta
    # instalación — editable únicamente por el rol superuser (app/modules/superadmin), nunca por
    # el admin del negocio: es un tope comercial de Soluciones Web, no un parámetro operativo del
    # cliente. Nulo = sin límite.
    limite_equipos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
