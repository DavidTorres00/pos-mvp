from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.categoria import Categoria
from app.models.proveedor import Proveedor
from app.models.subcategoria import Subcategoria


class Producto(Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    precio_venta: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    # costo actual del producto, para calcular utilidad/margen — nulo hasta que se recibe la
    # primera compra (compra_service.recibir lo sincroniza solo) o el admin lo carga a mano.
    # Nunca se infiere en 0: una línea de venta sin costo conocido queda fuera del cálculo de
    # utilidad en vez de inflarla artificialmente (ver docs/BACKEND.md).
    costo: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("categorias.id"), nullable=True)
    categoria: Mapped[Categoria | None] = relationship(lazy="joined")

    subcategoria_id: Mapped[int | None] = mapped_column(ForeignKey("subcategorias.id"), nullable=True)
    subcategoria: Mapped[Subcategoria | None] = relationship(lazy="joined")

    # quién surte habitualmente este producto (catálogo, no por sucursal) — informativo/default:
    # no restringe con qué proveedor se le puede armar un pedido en Compras (ver docs/BACKEND.md)
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("proveedores.id"), nullable=True)
    proveedor: Mapped[Proveedor | None] = relationship(lazy="joined")
