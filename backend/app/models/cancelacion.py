from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.usuario import Usuario


class Cancelacion(Base):
    """Anula una venta completa — a diferencia de `Devolucion` (parcial, deja la venta como
    válida), esto marca `Venta.estado = cancelada` y la excluye de reportes. Siempre de línea
    completa (todo lo vendido en ese ticket), por eso sin tabla de detalle propia — a diferencia
    de `Devolucion`/`DetalleDevolucion`. Ver docs/BACKEND.md."""

    __tablename__ = "cancelaciones"

    id: Mapped[int] = mapped_column(primary_key=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("ventas.id"), nullable=False, unique=True)
    actor_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    motivo: Mapped[str] = mapped_column(String(500), nullable=False)
    monto_total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # nulo cuando la venta original no fue en efectivo (nada que reversar en caja), o cuando el
    # actor no tiene caja abierta al momento de procesar (ver venta_service.cancelar)
    movimiento_caja_id: Mapped[int | None] = mapped_column(ForeignKey("movimientos_caja.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    actor: Mapped[Usuario] = relationship(lazy="joined")

    @property
    def actor_nombre(self) -> str:
        return self.actor.nombre
