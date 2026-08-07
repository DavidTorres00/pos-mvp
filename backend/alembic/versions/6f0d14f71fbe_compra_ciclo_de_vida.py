"""compra: ciclo de vida (pendiente/pagada/error/rechazada/recibida)

Compra deja de ser un solo paso (crear == ya recibido). Ahora: pendiente (armado, sin pagar) ->
pagada/error (Aprobar y pagar, dispara OpenPay) / rechazada (se cancela antes de pagar) ->
recibida (la mercancía llegó, ahí se generan los movimientos de entrada en Inventario — nunca al
crear la compra). Ver docs/BACKEND.md.

Revision ID: 6f0d14f71fbe
Revises: 34c1c7bb6fa2
Create Date: 2026-08-06 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6f0d14f71fbe'
down_revision: Union[str, Sequence[str], None] = '34c1c7bb6fa2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

estado_compra = sa.Enum('PENDIENTE', 'PAGADA', 'ERROR', 'RECHAZADA', 'RECIBIDA', name='estado_compra')


def upgrade() -> None:
    """Upgrade schema."""
    estado_compra.create(op.get_bind(), checkfirst=True)
    # compras históricas ya recibidas físicamente (creadas bajo el modelo de un solo paso) —
    # backfill a 'RECIBIDA' para no dejarlas atoradas en 'pendiente' sin haber pasado por el
    # flujo de aprobar/recibir
    op.add_column(
        'compras',
        sa.Column('estado', estado_compra, nullable=False, server_default='RECIBIDA'),
    )
    op.alter_column('compras', 'estado', server_default=None)
    op.add_column('compras', sa.Column('aprobado_por_id', sa.Integer(), nullable=True))
    op.add_column('compras', sa.Column('aprobado_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('compras', sa.Column('openpay_payment_id', sa.String(length=64), nullable=True))
    op.add_column('compras', sa.Column('error', sa.String(length=500), nullable=True))
    op.add_column('compras', sa.Column('recibido_por_id', sa.Integer(), nullable=True))
    op.add_column('compras', sa.Column('recibido_at', sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key('compras_aprobado_por_id_fkey', 'compras', 'usuarios', ['aprobado_por_id'], ['id'])
    op.create_foreign_key('compras_recibido_por_id_fkey', 'compras', 'usuarios', ['recibido_por_id'], ['id'])

    op.add_column('detalle_compras', sa.Column('cantidad_recibida', sa.Integer(), nullable=True))
    connection = op.get_bind()
    # compras históricas: lo recibido se asume igual a lo pedido (mismo backfill que 'estado')
    connection.execute(sa.text("UPDATE detalle_compras SET cantidad_recibida = cantidad"))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('detalle_compras', 'cantidad_recibida')

    op.drop_constraint('compras_recibido_por_id_fkey', 'compras', type_='foreignkey')
    op.drop_constraint('compras_aprobado_por_id_fkey', 'compras', type_='foreignkey')
    op.drop_column('compras', 'recibido_at')
    op.drop_column('compras', 'recibido_por_id')
    op.drop_column('compras', 'error')
    op.drop_column('compras', 'openpay_payment_id')
    op.drop_column('compras', 'aprobado_at')
    op.drop_column('compras', 'aprobado_por_id')
    op.drop_column('compras', 'estado')
    estado_compra.drop(op.get_bind(), checkfirst=True)
