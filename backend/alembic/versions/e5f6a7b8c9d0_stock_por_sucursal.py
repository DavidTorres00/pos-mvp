"""fase 2: stock por sucursal (stock_sucursal, reglas/ordenes/compras/movimientos por sucursal)

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-04 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "stock_sucursal",
        sa.Column("producto_id", sa.Integer(), sa.ForeignKey("productos.id"), primary_key=True),
        sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), primary_key=True),
        sa.Column("cantidad", sa.Integer(), nullable=False, server_default="0"),
        sa.CheckConstraint("cantidad >= 0", name="ck_stock_sucursal_no_negativo"),
    )

    connection = op.get_bind()
    # sucursal semilla de Fase 1 (la más antigua): todo el historial pre-multisucursal se le
    # asigna a ella — es la única sucursal que existía cuando se generaron esos datos
    sucursal_id = connection.execute(sa.text("SELECT id FROM sucursales ORDER BY id LIMIT 1")).scalar_one()

    # backfill 1:1 desde productos.stock — ninguna cantidad se pierde
    connection.execute(
        sa.text(
            "INSERT INTO stock_sucursal (producto_id, sucursal_id, cantidad) SELECT id, :sucursal_id, stock FROM productos"
        ),
        {"sucursal_id": sucursal_id},
    )
    # no se mantiene como total denormalizado: un total across-sucursales se calcula con SUM al vuelo
    op.drop_column("productos", "stock")

    op.add_column(
        "movimientos_inventario", sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), nullable=True)
    )
    connection.execute(sa.text("UPDATE movimientos_inventario SET sucursal_id = :sucursal_id"), {"sucursal_id": sucursal_id})
    op.alter_column("movimientos_inventario", "sucursal_id", nullable=False)

    # reglas_reorden: producto_id pierde el unique simple, se reemplaza por (producto_id, sucursal_id)
    op.drop_constraint("reglas_reorden_producto_id_key", "reglas_reorden", type_="unique")
    op.add_column(
        "reglas_reorden", sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), nullable=True)
    )
    connection.execute(sa.text("UPDATE reglas_reorden SET sucursal_id = :sucursal_id"), {"sucursal_id": sucursal_id})
    op.alter_column("reglas_reorden", "sucursal_id", nullable=False)
    op.create_unique_constraint("uq_reglas_reorden_producto_sucursal", "reglas_reorden", ["producto_id", "sucursal_id"])

    # ordenes_reorden: hereda sucursal_id de la regla que la disparó — regla_reorden_id ya
    # identifica unívocamente producto+sucursal tras el cambio anterior, así que el índice único
    # parcial existente (una pendiente por regla) sigue funcionando igual sin cambios
    op.add_column(
        "ordenes_reorden", sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), nullable=True)
    )
    connection.execute(
        sa.text(
            """
            UPDATE ordenes_reorden o SET sucursal_id = r.sucursal_id
            FROM reglas_reorden r WHERE o.regla_reorden_id = r.id
            """
        )
    )
    op.alter_column("ordenes_reorden", "sucursal_id", nullable=False)

    # compras: una compra completa llega a una sola sucursal (igual que hoy llega a un solo proveedor)
    op.add_column("compras", sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), nullable=True))
    connection.execute(sa.text("UPDATE compras SET sucursal_id = :sucursal_id"), {"sucursal_id": sucursal_id})
    op.alter_column("compras", "sucursal_id", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("compras", "sucursal_id")
    op.drop_column("ordenes_reorden", "sucursal_id")
    op.drop_constraint("uq_reglas_reorden_producto_sucursal", "reglas_reorden", type_="unique")
    op.drop_column("reglas_reorden", "sucursal_id")
    op.create_unique_constraint("reglas_reorden_producto_id_key", "reglas_reorden", ["producto_id"])
    op.drop_column("movimientos_inventario", "sucursal_id")

    op.add_column("productos", sa.Column("stock", sa.Integer(), nullable=False, server_default="0"))
    connection = op.get_bind()
    # best-effort: suma de todas las sucursales al reabrir la columna denormalizada
    connection.execute(
        sa.text(
            "UPDATE productos p SET stock = COALESCE((SELECT SUM(cantidad) FROM stock_sucursal s WHERE s.producto_id = p.id), 0)"
        )
    )
    op.drop_table("stock_sucursal")
