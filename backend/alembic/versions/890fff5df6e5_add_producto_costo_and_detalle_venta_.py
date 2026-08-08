"""add producto costo and detalle_venta costo_unitario

Revision ID: 890fff5df6e5
Revises: 19f49e5bcc6a
Create Date: 2026-08-08 01:46:13.759955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '890fff5df6e5'
down_revision: Union[str, Sequence[str], None] = '19f49e5bcc6a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # nota: el autogenerate también proponía borrar 'stock_sucursal'/'alertas_acuse' y otros
    # cambios ajenos — falsos positivos porque alembic/env.py no importa esos modelos (ver
    # docs/BACKEND.md, "cuidado con alembic revision --autogenerate"), eliminados a mano.
    op.add_column('productos', sa.Column('costo', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('detalle_ventas', sa.Column('costo_unitario', sa.Numeric(precision=10, scale=2), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('detalle_ventas', 'costo_unitario')
    op.drop_column('productos', 'costo')
