from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.detalle_venta import DetalleVenta
from app.models.usuario import Usuario


class Devolucion(Base):
    """Reversa (total o parcial) de una venta ya cobrada — nunca edita `Venta`/`DetalleVenta`,
    que quedan como registro histórico inmutable; esto es un movimiento aparte que los
    referencia. Ver docs/BACKEND.md."""

    __tablename__ = "devoluciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("ventas.id"), nullable=False)
    actor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    motivo: Mapped[str] = mapped_column(String(500), nullable=False)
    monto_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # nulo cuando la venta original no fue en efectivo (nada que reversar en caja), o cuando el
    # actor no tiene caja abierta al momento de procesar (ver devolucion_service)
    movimiento_caja_id: Mapped[int | None] = mapped_column(ForeignKey("movimientos_caja.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    actor: Mapped[Usuario] = relationship(lazy="joined")
    items: Mapped[list["DetalleDevolucion"]] = relationship(back_populates="devolucion", lazy="selectin")

    @property
    def actor_nombre(self) -> str:
        return self.actor.nombre


class DetalleDevolucion(Base):
    __tablename__ = "detalle_devoluciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    devolucion_id: Mapped[int] = mapped_column(ForeignKey("devoluciones.id"), nullable=False)
    detalle_venta_id: Mapped[int] = mapped_column(ForeignKey("detalle_ventas.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    devolucion: Mapped[Devolucion] = relationship(back_populates="items")
    detalle_venta: Mapped[DetalleVenta] = relationship(lazy="joined")

    @property
    def producto_id(self) -> int:
        return self.detalle_venta.producto_id

    @property
    def producto_nombre(self) -> str:
        return self.detalle_venta.producto.nombre
