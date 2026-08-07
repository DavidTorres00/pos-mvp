import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.proveedor import Proveedor
from app.models.sucursal import Sucursal
from app.models.usuario import Usuario

if TYPE_CHECKING:
    from app.models.detalle_compra import DetalleCompra


class EstadoCompra(str, enum.Enum):
    PENDIENTE = "pendiente"
    PAGADA = "pagada"
    ERROR = "error"
    RECHAZADA = "rechazada"
    RECIBIDA = "recibida"


class Compra(Base):
    """Pedido a un proveedor, siempre armado y aprobado a mano por el admin — nunca disparado
    solo por el sistema (ver docs/BACKEND.md). Ciclo: `pendiente` (armado, sin pagar) ->
    `pagada`/`error` (Aprobar y pagar, dispara el pago real vía OpenPay) o `rechazada` (se
    cancela antes de pagar) -> `recibida` (la mercancía llegó a la sucursal, ahí se generan los
    movimientos de entrada en Inventario — nunca antes, el pago y la recepción son momentos
    distintos)."""

    __tablename__ = "compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedores.id"), nullable=False)
    sucursal_id: Mapped[int] = mapped_column(ForeignKey("sucursales.id"), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    estado: Mapped[EstadoCompra] = mapped_column(
        Enum(EstadoCompra, name="estado_compra"), default=EstadoCompra.PENDIENTE, nullable=False
    )
    aprobado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    aprobado_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    openpay_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recibido_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    recibido_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    proveedor: Mapped[Proveedor] = relationship(lazy="joined")
    sucursal: Mapped[Sucursal] = relationship(lazy="joined")
    usuario: Mapped[Usuario] = relationship(foreign_keys=[usuario_id], lazy="joined")
    aprobado_por: Mapped[Usuario | None] = relationship(foreign_keys=[aprobado_por_id], lazy="joined")
    recibido_por: Mapped[Usuario | None] = relationship(foreign_keys=[recibido_por_id], lazy="joined")
    items: Mapped[list["DetalleCompra"]] = relationship(back_populates="compra", lazy="selectin")
