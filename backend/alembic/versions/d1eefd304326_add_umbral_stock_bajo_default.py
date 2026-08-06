"""add umbral_stock_bajo_default

Revision ID: d1eefd304326
Revises: e5f6a7b8c9d0
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd1eefd304326'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # nulo por defecto = feature apagada, mismo criterio que los topes de OpenPay
    op.add_column('configuracion_negocio', sa.Column('umbral_stock_bajo_default', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configuracion_negocio', 'umbral_stock_bajo_default')
