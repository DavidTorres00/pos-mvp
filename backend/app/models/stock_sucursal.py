from sqlalchemy import CheckConstraint, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class StockSucursal(Base):
    """Tabla de hechos pura: un renglón por combinación producto×sucursal. Sin surrogate id —
    la clave primaria compuesta ES la identidad del hecho que representa."""

    __tablename__ = "stock_sucursal"
    __table_args__ = (CheckConstraint("cantidad >= 0", name="ck_stock_sucursal_no_negativo"),)

    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), primary_key=True)
    sucursal_id: Mapped[int] = mapped_column(ForeignKey("sucursales.id"), primary_key=True)
    cantidad: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
