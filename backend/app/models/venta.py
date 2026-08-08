import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.caja import CajaSesion
    from app.models.detalle_venta import DetalleVenta
    from app.models.usuario import Usuario


class FormaPago(str, enum.Enum):
    EFECTIVO = "efectivo"
    TARJETA = "tarjeta"
    TRANSFERENCIA = "transferencia"


class EstadoVenta(str, enum.Enum):
    COMPLETADA = "completada"
    # anulada por `venta_service.cancelar` (error del cajero, nunca debió contar) — excluida de
    # todo agregado de reportes, a diferencia de una devolución, que deja la venta como válida y
    # solo se netea. Ver docs/BACKEND.md.
    CANCELADA = "cancelada"


class Venta(Base):
    __tablename__ = "ventas"

    id: Mapped[int] = mapped_column(primary_key=True)
    caja_id: Mapped[int] = mapped_column(ForeignKey("caja_sesiones.id"), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    forma_pago: Mapped[FormaPago] = mapped_column(Enum(FormaPago, name="forma_pago"), nullable=False)
    estado: Mapped[EstadoVenta] = mapped_column(
        Enum(EstadoVenta, name="estado_venta"), nullable=False, default=EstadoVenta.COMPLETADA
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["DetalleVenta"]] = relationship(back_populates="venta", lazy="selectin")
    caja: Mapped["CajaSesion"] = relationship(lazy="joined")
    usuario: Mapped["Usuario"] = relationship(lazy="joined")

    @property
    def sucursal_nombre(self) -> str:
        return self.caja.sucursal_nombre

    @property
    def usuario_nombre(self) -> str:
        return self.usuario.nombre
