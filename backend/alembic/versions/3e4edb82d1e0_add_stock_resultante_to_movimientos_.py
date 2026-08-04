"""add stock_resultante to movimientos_inventario

Revision ID: 3e4edb82d1e0
Revises: f39b82803b11
Create Date: 2026-08-04 14:07:25.376875

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3e4edb82d1e0'
down_revision: Union[str, Sequence[str], None] = 'f39b82803b11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("movimientos_inventario", sa.Column("stock_resultante", sa.Integer(), nullable=True))

    connection = op.get_bind()
    productos_ids = connection.execute(
        sa.text("SELECT DISTINCT producto_id FROM movimientos_inventario")
    ).scalars().all()

    for producto_id in productos_ids:
        rows = connection.execute(
            sa.text(
                "SELECT id, tipo, cantidad FROM movimientos_inventario "
                "WHERE producto_id = :pid ORDER BY created_at ASC, id ASC"
            ),
            {"pid": producto_id},
        ).fetchall()
        running = 0
        for row in rows:
            running += row.cantidad if row.tipo == "ENTRADA" else -row.cantidad
            connection.execute(
                sa.text("UPDATE movimientos_inventario SET stock_resultante = :stock WHERE id = :id"),
                {"stock": running, "id": row.id},
            )

    op.alter_column("movimientos_inventario", "stock_resultante", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("movimientos_inventario", "stock_resultante")
