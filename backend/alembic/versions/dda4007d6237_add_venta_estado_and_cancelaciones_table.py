"""add venta estado and cancelaciones table

Revision ID: dda4007d6237
Revises: 890fff5df6e5
Create Date: 2026-08-08 02:30:26.170383

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dda4007d6237'
down_revision: Union[str, Sequence[str], None] = '890fff5df6e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

estado_venta_enum = sa.Enum('COMPLETADA', 'CANCELADA', name='estado_venta')


def upgrade() -> None:
    """Upgrade schema."""
    estado_venta_enum.create(op.get_bind(), checkfirst=True)
    # backfill: toda venta existente ya está completada — el default es solo para el backfill,
    # el ORM siempre manda el valor explícito en cada insert nuevo (mismo criterio que
    # puede_hacer_devoluciones en 19f49e5bcc6a). Valores en mayúscula: SQLAlchemy con
    # Enum(PythonEnumClass) guarda el *nombre* del miembro, no `.value` (mismo criterio que
    # 'forma_pago' en e50b52925a4a).
    op.add_column('ventas', sa.Column('estado', estado_venta_enum, nullable=False, server_default='COMPLETADA'))
    op.alter_column('ventas', 'estado', server_default=None)

    op.create_table('cancelaciones',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('venta_id', sa.Integer(), nullable=False),
    sa.Column('actor_id', sa.Integer(), nullable=False),
    sa.Column('motivo', sa.String(length=500), nullable=False),
    sa.Column('monto_total', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('movimiento_caja_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['actor_id'], ['usuarios.id'], ),
    sa.ForeignKeyConstraint(['movimiento_caja_id'], ['movimientos_caja.id'], ),
    sa.ForeignKeyConstraint(['venta_id'], ['ventas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('venta_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('cancelaciones')
    op.drop_column('ventas', 'estado')
    estado_venta_enum.drop(op.get_bind(), checkfirst=True)
