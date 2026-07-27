"""add role to usuarios

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-07-26 19:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

rol_usuario = sa.Enum('ADMIN', 'CAJERO', name='rol_usuario')


def upgrade() -> None:
    """Upgrade schema."""
    rol_usuario.create(op.get_bind(), checkfirst=True)
    # backfill: los usuarios existentes conservan acceso total (admin); el default se retira
    # después para que cualquier alta futura de usuario deba declarar el rol explícitamente.
    op.add_column('usuarios', sa.Column('role', rol_usuario, nullable=False, server_default='ADMIN'))
    op.alter_column('usuarios', 'role', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('usuarios', 'role')
    rol_usuario.drop(op.get_bind(), checkfirst=True)
