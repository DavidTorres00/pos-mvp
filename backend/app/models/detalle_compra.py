from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.compra import Compra
from app.models.producto import Producto


class DetalleCompra(Base):
    __tablename__ = "detalle_compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    compra_id: Mapped[int] = mapped_column(ForeignKey("compras.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # nulo hasta que la compra se recibe — puede diferir de `cantidad` (lo pedido) si el
    # proveedor entregó de más/de menos; es lo que de verdad se suma a Inventario al recibir
    cantidad_recibida: Mapped[int | None] = mapped_column(Integer, nullable=True)

    compra: Mapped[Compra] = relationship(back_populates="items")
    producto: Mapped[Producto] = relationship(lazy="joined")
