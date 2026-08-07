"""add proveedor_id to productos

Quién surte habitualmente un producto, a nivel catálogo (global, no por sucursal) — antes solo
existía `ReglaReorden.proveedor_id`, que ya no existe (reorden automático eliminado, ver
c2db48ad658a) y de todos modos solo aplicaba a productos con una regla configurada.

Revision ID: 34c1c7bb6fa2
Revises: c2db48ad658a
Create Date: 2026-08-06 16:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '34c1c7bb6fa2'
down_revision: Union[str, Sequence[str], None] = 'c2db48ad658a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('productos', sa.Column('proveedor_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'productos_proveedor_id_fkey', 'productos', 'proveedores', ['proveedor_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('productos_proveedor_id_fkey', 'productos', type_='foreignkey')
    op.drop_column('productos', 'proveedor_id')
