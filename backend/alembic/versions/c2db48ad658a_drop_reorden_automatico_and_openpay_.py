"""drop reorden automatico and openpay caps

El reorden automático (ReglaReorden -> OrdenReorden, pago disparado solo al cruzar un umbral de
stock) se elimina por completo: decisión de negocio, un pedido a proveedor y su pago siempre
deben ser un acto manual del admin, nunca algo que el sistema dispare solo (ver docs/BACKEND.md).
Junto con eso caen los topes de gasto de OpenPay en ConfiguracionNegocio — existían para acotar
el riesgo de la automatización; sin automatización, la revisión manual del admin en cada pedido
ya es el control, un segundo tope automático es redundante.

Revision ID: c2db48ad658a
Revises: 687bece5796d
Create Date: 2026-08-06 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c2db48ad658a'
down_revision: Union[str, Sequence[str], None] = '687bece5796d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_index('ix_ordenes_reorden_una_pendiente_por_regla', table_name='ordenes_reorden')
    op.drop_table('ordenes_reorden')
    op.drop_table('reglas_reorden')
    op.execute('DROP TYPE IF EXISTS estado_orden_reorden')
    op.drop_column('configuracion_negocio', 'openpay_tope_por_orden')
    op.drop_column('configuracion_negocio', 'openpay_tope_diario')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('configuracion_negocio', sa.Column('openpay_tope_diario', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('configuracion_negocio', sa.Column('openpay_tope_por_orden', sa.Numeric(precision=10, scale=2), nullable=True))

    estado_orden_reorden = sa.Enum('PENDIENTE', 'APROBADA', 'RECHAZADA', 'PAGADA', 'ERROR', name='estado_orden_reorden')
    estado_orden_reorden.create(op.get_bind(), checkfirst=True)

    op.create_table(
        'reglas_reorden',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('producto_id', sa.Integer(), nullable=False),
        sa.Column('proveedor_id', sa.Integer(), nullable=False),
        sa.Column('sucursal_id', sa.Integer(), nullable=False),
        sa.Column('umbral_stock', sa.Integer(), nullable=False),
        sa.Column('cantidad_pedido', sa.Integer(), nullable=False),
        sa.Column('costo_unitario_estimado', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('activo', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['producto_id'], ['productos.id']),
        sa.ForeignKeyConstraint(['proveedor_id'], ['proveedores.id']),
        sa.ForeignKeyConstraint(['sucursal_id'], ['sucursales.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('producto_id', 'sucursal_id', name='uq_reglas_reorden_producto_sucursal'),
    )
    op.create_table(
        'ordenes_reorden',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('regla_reorden_id', sa.Integer(), nullable=False),
        sa.Column('producto_id', sa.Integer(), nullable=False),
        sa.Column('proveedor_id', sa.Integer(), nullable=False),
        sa.Column('sucursal_id', sa.Integer(), nullable=False),
        sa.Column('cantidad', sa.Integer(), nullable=False),
        sa.Column('monto_estimado', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('estado', estado_orden_reorden, nullable=False),
        sa.Column('aprobado_por_id', sa.Integer(), nullable=True),
        sa.Column('aprobado_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('openpay_payment_id', sa.String(length=64), nullable=True),
        sa.Column('error', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['aprobado_por_id'], ['usuarios.id']),
        sa.ForeignKeyConstraint(['producto_id'], ['productos.id']),
        sa.ForeignKeyConstraint(['proveedor_id'], ['proveedores.id']),
        sa.ForeignKeyConstraint(['regla_reorden_id'], ['reglas_reorden.id']),
        sa.ForeignKeyConstraint(['sucursal_id'], ['sucursales.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_ordenes_reorden_una_pendiente_por_regla',
        'ordenes_reorden',
        ['regla_reorden_id'],
        unique=True,
        postgresql_where=sa.text("estado = 'PENDIENTE'"),
    )
