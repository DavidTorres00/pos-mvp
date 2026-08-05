"""create sucursales, equipos and enable multi-caja per equipo/usuario

Revision ID: d4e5f6a7b8c9
Revises: 3e4edb82d1e0
Create Date: 2026-08-04 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, Sequence[str], None] = '3e4edb82d1e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SUCURSAL_SEMILLA = "Sucursal 1"
EQUIPO_SEMILLA = "Equipo 1"


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "sucursales",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("nombre", name="uq_sucursales_nombre"),
    )
    op.create_table(
        "equipos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), nullable=False),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("sucursal_id", "nombre", name="uq_equipos_sucursal_nombre"),
    )

    connection = op.get_bind()
    sucursales_table = sa.table(
        "sucursales", sa.column("id", sa.Integer), sa.column("nombre", sa.String), sa.column("activo", sa.Boolean)
    )
    equipos_table = sa.table(
        "equipos",
        sa.column("id", sa.Integer),
        sa.column("sucursal_id", sa.Integer),
        sa.column("nombre", sa.String),
        sa.column("activo", sa.Boolean),
    )

    # nombre deliberadamente genérico/placeholder — el admin la renombra desde el CRUD apenas migre
    sucursal_id = connection.execute(
        sucursales_table.insert().values(nombre=SUCURSAL_SEMILLA, activo=True).returning(sucursales_table.c.id)
    ).scalar_one()
    equipo_id = connection.execute(
        equipos_table.insert()
        .values(sucursal_id=sucursal_id, nombre=EQUIPO_SEMILLA, activo=True)
        .returning(equipos_table.c.id)
    ).scalar_one()

    # usuarios: nullable primero (admin no pertenece a ninguna sucursal), backfill de cajeros
    # existentes contra la sucursal semilla, luego el CHECK que endurece la regla a nivel de datos
    op.add_column("usuarios", sa.Column("sucursal_id", sa.Integer(), sa.ForeignKey("sucursales.id"), nullable=True))
    connection.execute(
        sa.text("UPDATE usuarios SET sucursal_id = :sucursal_id WHERE role = 'CAJERO'"),
        {"sucursal_id": sucursal_id},
    )
    op.create_check_constraint(
        "ck_usuarios_cajero_requiere_sucursal", "usuarios", "role != 'CAJERO' OR sucursal_id IS NOT NULL"
    )

    # caja_sesiones: mismo patrón — columna nullable, backfill de TODAS las filas (históricas y
    # actuales) contra el equipo semilla, endurecer a NOT NULL recién al final
    op.add_column("caja_sesiones", sa.Column("equipo_id", sa.Integer(), nullable=True))
    connection.execute(
        sa.text("UPDATE caja_sesiones SET equipo_id = :equipo_id"),
        {"equipo_id": equipo_id},
    )
    op.alter_column("caja_sesiones", "equipo_id", nullable=False)
    op.create_foreign_key(None, "caja_sesiones", "equipos", ["equipo_id"], ["id"])

    # con N equipos y N cajeros puede haber varias cajas abiertas a la vez: el único índice global
    # se reemplaza por dos parciales que preservan ambas garantías de negocio (un cajero no duplica
    # su propia caja, un equipo no queda ocupado por dos cajas a la vez)
    op.drop_index("ix_caja_sesiones_una_abierta", table_name="caja_sesiones")
    op.create_index(
        "ix_caja_sesiones_una_abierta_por_equipo",
        "caja_sesiones",
        ["equipo_id"],
        unique=True,
        postgresql_where=sa.text("abierta = true"),
    )
    op.create_index(
        "ix_caja_sesiones_una_abierta_por_usuario",
        "caja_sesiones",
        ["usuario_id"],
        unique=True,
        postgresql_where=sa.text("abierta = true"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_caja_sesiones_una_abierta_por_usuario", table_name="caja_sesiones")
    op.drop_index("ix_caja_sesiones_una_abierta_por_equipo", table_name="caja_sesiones")
    op.create_index(
        "ix_caja_sesiones_una_abierta",
        "caja_sesiones",
        ["abierta"],
        unique=True,
        postgresql_where=sa.text("abierta = true"),
    )
    op.drop_constraint(None, "caja_sesiones", type_="foreignkey")
    op.drop_column("caja_sesiones", "equipo_id")
    op.drop_constraint("ck_usuarios_cajero_requiere_sucursal", "usuarios", type_="check")
    op.drop_column("usuarios", "sucursal_id")
    op.drop_table("equipos")
    op.drop_table("sucursales")
