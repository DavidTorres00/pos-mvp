import enum
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.producto import Producto
from app.models.proveedor import Proveedor
from app.models.sucursal import Sucursal
from app.models.usuario import Usuario


class EstadoOrdenReorden(str, enum.Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"
    PAGADA = "pagada"
    ERROR = "error"


class OrdenReorden(Base):
    """Orden sugerida por una ReglaReorden. V1: siempre requiere aprobación manual del admin
    antes de pagar (§4.6) — nunca se paga automáticamente sin intervención humana."""

    __tablename__ = "ordenes_reorden"

    id: Mapped[int] = mapped_column(primary_key=True)
    regla_reorden_id: Mapped[int] = mapped_column(ForeignKey("reglas_reorden.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    sucursal_id: Mapped[int] = mapped_column(ForeignKey("sucursales.id"), nullable=False)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedores.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    monto_estimado: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    estado: Mapped[EstadoOrdenReorden] = mapped_column(
        Enum(EstadoOrdenReorden, name="estado_orden_reorden"), default=EstadoOrdenReorden.PENDIENTE, nullable=False
    )
    aprobado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    aprobado_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    openpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    producto: Mapped[Producto] = relationship(lazy="joined")
    sucursal: Mapped[Sucursal] = relationship(lazy="joined")
    proveedor: Mapped[Proveedor] = relationship(lazy="joined")
    aprobado_por: Mapped[Usuario | None] = relationship(lazy="joined")
