"""caja unica abierta and stock no negativo

Revision ID: a1b2c3d4e5f6
Revises: 7c506370e5f6
Create Date: 2026-07-26 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '7c506370e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_index(
        'ix_caja_sesiones_una_abierta',
        'caja_sesiones',
        ['abierta'],
        unique=True,
        postgresql_where=sa.text('abierta = true'),
    )
    op.create_check_constraint(
        'ck_productos_stock_no_negativo',
        'productos',
        'stock >= 0',
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('ck_productos_stock_no_negativo', 'productos', type_='check')
    op.drop_index('ix_caja_sesiones_una_abierta', table_name='caja_sesiones')
