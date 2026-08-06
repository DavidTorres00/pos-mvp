"""add sucursal datos y limite

Revision ID: b683348cca52
Revises: d1eefd304326
Create Date: 2026-08-05 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b683348cca52'
down_revision: Union[str, Sequence[str], None] = 'd1eefd304326'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('sucursales', sa.Column('direccion', sa.String(length=255), nullable=True))
    op.add_column('sucursales', sa.Column('responsable', sa.String(length=255), nullable=True))
    op.add_column('sucursales', sa.Column('telefono', sa.String(length=32), nullable=True))
    # nulo = usa el default global de configuracion_negocio.limite_efectivo_caja
    op.add_column('sucursales', sa.Column('limite_efectivo_caja', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('sucursales', 'limite_efectivo_caja')
    op.drop_column('sucursales', 'telefono')
    op.drop_column('sucursales', 'responsable')
    op.drop_column('sucursales', 'direccion')
