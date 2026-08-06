"""add alertas_acuse

Revision ID: 687bece5796d
Revises: b683348cca52
Create Date: 2026-08-05 23:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '687bece5796d'
down_revision: Union[str, Sequence[str], None] = 'b683348cca52'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'alertas_acuse',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.String(length=64), nullable=False),
        sa.Column('referencia_id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('tipo', 'referencia_id', name='uq_alertas_acuse_tipo_referencia'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('alertas_acuse')
