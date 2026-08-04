import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.producto import Producto


class TipoMovimiento(str, enum.Enum):
    ENTRADA = "entrada"
    SALIDA = "salida"


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    tipo: Mapped[TipoMovimiento] = mapped_column(Enum(TipoMovimiento, name="tipo_movimiento"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    # snapshot del stock justo después de aplicar este movimiento (no el stock actual del producto,
    # que cambia con movimientos posteriores) — necesario para que el historial sea coherente
    stock_resultante: Mapped[int] = mapped_column(Integer, nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    producto: Mapped[Producto] = relationship(lazy="joined")
