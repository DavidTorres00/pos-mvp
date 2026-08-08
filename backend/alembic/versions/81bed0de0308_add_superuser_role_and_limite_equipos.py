"""add superuser role and limite_equipos

Revision ID: 81bed0de0308
Revises: dda4007d6237
Create Date: 2026-08-08 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81bed0de0308'
down_revision: Union[str, Sequence[str], None] = 'dda4007d6237'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # rol_usuario ya existe (creado en b2c3d4e5f6a7) — Postgres 12+ permite ADD VALUE dentro de
    # una transacción siempre que no se use el valor nuevo en la misma migración.
    op.execute("ALTER TYPE rol_usuario ADD VALUE IF NOT EXISTS 'SUPERUSER'")
    # nulo = sin límite (instalaciones existentes/dev quedan sin tope hasta que el superuser
    # configure uno real para ese cliente)
    op.add_column('configuracion_negocio', sa.Column('limite_equipos', sa.Integer(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('configuracion_negocio', 'limite_equipos')
    # Postgres no soporta quitar un valor de un enum (DROP VALUE no existe) — el valor
    # 'SUPERUSER' queda en el tipo, sin efecto si no hay ninguna fila usándolo.
