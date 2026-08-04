from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.producto import Producto
from app.models.proveedor import Proveedor


class ReglaReorden(Base):
    """Regla de reorden automático: cuando producto.stock llega a umbral_stock, se dispara una
    OrdenReorden sugerida por cantidad_pedido unidades al proveedor asociado. Un producto tiene
    a lo sumo una regla (unique)."""

    __tablename__ = "reglas_reorden"

    id: Mapped[int] = mapped_column(primary_key=True)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), unique=True, nullable=False)
    proveedor_id: Mapped[int] = mapped_column(ForeignKey("proveedores.id"), nullable=False)
    umbral_stock: Mapped[int] = mapped_column(Integer, nullable=False)
    cantidad_pedido: Mapped[int] = mapped_column(Integer, nullable=False)
    # costo estimado por unidad: determina el monto de la orden/pago sugerido, ya que no existe
    # un "costo actual" canónico en Producto (solo el precio de venta)
    costo_unitario_estimado: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    producto: Mapped[Producto] = relationship(lazy="joined")
    proveedor: Mapped[Proveedor] = relationship(lazy="joined")
