from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.producto import Producto
from app.models.venta import Venta


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id: Mapped[int] = mapped_column(primary_key=True)
    venta_id: Mapped[int] = mapped_column(ForeignKey("ventas.id"), nullable=False)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), nullable=False)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # congelado desde Producto.costo al momento de la venta (igual que precio_unitario) — nulo si
    # el producto no tenía costo cargado en ese momento, para no inventar una utilidad falsa
    costo_unitario: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    venta: Mapped[Venta] = relationship(back_populates="items")
    producto: Mapped[Producto] = relationship(lazy="joined")

    @property
    def utilidad(self) -> Decimal | None:
        if self.costo_unitario is None:
            return None
        return (self.precio_unitario - self.costo_unitario) * self.cantidad
