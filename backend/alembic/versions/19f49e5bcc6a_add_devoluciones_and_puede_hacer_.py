"""add devoluciones and puede_hacer_devoluciones

Revision ID: 19f49e5bcc6a
Revises: 6f0d14f71fbe
Create Date: 2026-08-07 23:16:04.359543

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '19f49e5bcc6a'
down_revision: Union[str, Sequence[str], None] = '6f0d14f71fbe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # nota: el autogenerate también proponía borrar 'stock_sucursal'/'alertas_acuse' y otros
    # cambios ajenos a esta migración — son falsos positivos porque alembic/env.py no importa
    # esos modelos (ver docs/BACKEND.md, "cuidado con alembic revision --autogenerate"),
    # eliminados a mano de este archivo.
    op.create_table('devoluciones',
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
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('detalle_devoluciones',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('devolucion_id', sa.Integer(), nullable=False),
    sa.Column('detalle_venta_id', sa.Integer(), nullable=False),
    sa.Column('cantidad', sa.Integer(), nullable=False),
    sa.Column('subtotal', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.ForeignKeyConstraint(['detalle_venta_id'], ['detalle_ventas.id'], ),
    sa.ForeignKeyConstraint(['devolucion_id'], ['devoluciones.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # backfill: usuarios existentes no pueden hacer devoluciones hasta que el admin lo habilite
    op.add_column('usuarios', sa.Column('puede_hacer_devoluciones', sa.Boolean(), nullable=False, server_default='false'))
    op.alter_column('usuarios', 'puede_hacer_devoluciones', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('usuarios', 'puede_hacer_devoluciones')
    op.drop_table('detalle_devoluciones')
    op.drop_table('devoluciones')
