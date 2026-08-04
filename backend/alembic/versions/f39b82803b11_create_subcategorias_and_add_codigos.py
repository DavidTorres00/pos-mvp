"""create subcategorias and add codigos

Revision ID: f39b82803b11
Revises: e50b52925a4a
Create Date: 2026-08-04 12:00:19.047130

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f39b82803b11'
down_revision: Union[str, Sequence[str], None] = 'e50b52925a4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Catálogo de referencia: docs/info-categorias-productos.pdf (reemplaza el catálogo plano anterior)
CATEGORIAS = [
    ("01", "Abarrotes", [
        ("01", "Aceites"),
        ("02", "Arroz"),
        ("03", "Fideos, Pastas y Sus Salsas"),
        ("04", "Menestras y Legumbres"),
        ("05", "Harinas y Feculas"),
        ("06", "Pures, Soya, Bases y Sopas"),
        ("07", "Alimentos en Conserva"),
        ("08", "Condimentos, Vinagres y Salsas"),
    ]),
    ("02", "Frutas y Verduras", [
        ("01", "Frutas"),
        ("02", "Mas Frutas"),
        ("03", "Mundo Chino"),
        ("04", "Verduras"),
        ("05", "Mas Verduras"),
        ("06", "Mundo Organico"),
    ]),
    ("03", "Lacteos y Huevos", [
        ("01", "Huevos Frescos"),
        ("02", "Leche Evaporada"),
        ("03", "Leche UTH"),
        ("04", "Yogurt"),
        ("05", "Bebidas Especiales"),
        ("06", "Mantequillas y Margarinas"),
        ("07", "Leche en Bolsa / Botella Vidrio"),
        ("08", "Otros Productos de Leche"),
    ]),
    ("04", "Quesos y Fiambres", [
        ("01", "Quesos Regulares y Frescos"),
        ("02", "Queso Gourmet"),
        ("03", "Quesos Regionales"),
        ("04", "Chorizos y Vienesas"),
        ("05", "Aceitunas"),
        ("06", "Jamones y Jamonadas"),
        ("07", "Fiambres Gourmet"),
        ("08", "Otros Fiambres"),
    ]),
    ("05", "Carnes, Pollos y Pescados", [
        ("01", "Carnes de Res"),
        ("02", "Carnes de Pollo"),
        ("03", "Carnes de Cerdo"),
        ("04", "Carnes de Pavo"),
        ("05", "Carnes Especiales"),
        ("06", "Pescados y Mariscos"),
    ]),
    ("06", "Cuidado Personal", [
        ("01", "Cuidado del Cabello"),
        ("02", "Cuidado Corporal"),
        ("03", "Cuidado Bucal"),
        ("04", "Afeitado y Depilacion"),
        ("05", "Higiene Femenina"),
        ("06", "Salud"),
    ]),
    ("07", "Limpieza", [
        ("01", "Lavado y Cuidado de la Ropa"),
        ("02", "Productos de Papel para el Hogar"),
        ("03", "Lavado y Cuidado del Hogar"),
        ("04", "Accesorios de Limpieza"),
    ]),
    ("08", "Cervezas, Vinos y Bebidas", [
        ("01", "Agua Mineral"),
        ("02", "Jugos y Bebidas"),
        ("03", "Gaseosas"),
        ("04", "Cervezas"),
        ("05", "Vinos por Paises"),
        ("06", "Licores y Bases para Licores"),
    ]),
    ("09", "Panaderia y Pasteleria", [
        ("01", "Panaderia"),
        ("02", "Pasteleria"),
    ]),
    ("10", "Alimentos Congelados", [
        ("01", "Productos de Pollo"),
        ("02", "Productos de Res"),
        ("03", "Otros Alimentos Congelados"),
        ("04", "Masas y Pastas Congeladas"),
    ]),
    ("11", "Listo para Servir", [
        ("01", "Comida Criolla"),
        ("02", "Bocaditos"),
    ]),
    ("12", "Mascotas", [
        ("01", "Alimentos para Perros"),
        ("02", "Alimentos para Gatos"),
    ]),
]


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("categorias", sa.Column("codigo", sa.String(length=2), nullable=True))

    op.create_table(
        "subcategorias",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nombre", sa.String(length=255), nullable=False),
        sa.Column("codigo", sa.String(length=2), nullable=False),
        sa.Column("activo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("categoria_id", sa.Integer(), sa.ForeignKey("categorias.id"), nullable=False),
        sa.UniqueConstraint("categoria_id", "codigo", name="uq_subcategorias_categoria_codigo"),
        sa.UniqueConstraint("categoria_id", "nombre", name="uq_subcategorias_categoria_nombre"),
    )

    op.add_column(
        "productos",
        sa.Column("subcategoria_id", sa.Integer(), sa.ForeignKey("subcategorias.id"), nullable=True),
    )

    # Reemplaza el catálogo plano anterior por el esquema de 12 categorías / subcategorías del PDF de
    # referencia; los productos existentes quedan sin categoría para reasignación manual.
    op.execute("UPDATE productos SET categoria_id = NULL")
    op.execute("DELETE FROM categorias")

    connection = op.get_bind()
    categorias_table = sa.table(
        "categorias",
        sa.column("id", sa.Integer),
        sa.column("nombre", sa.String),
        sa.column("codigo", sa.String),
        sa.column("activo", sa.Boolean),
    )
    subcategorias_table = sa.table(
        "subcategorias",
        sa.column("id", sa.Integer),
        sa.column("nombre", sa.String),
        sa.column("codigo", sa.String),
        sa.column("activo", sa.Boolean),
        sa.column("categoria_id", sa.Integer),
    )

    for cat_codigo, cat_nombre, subs in CATEGORIAS:
        result = connection.execute(
            categorias_table.insert()
            .values(nombre=cat_nombre, codigo=cat_codigo, activo=True)
            .returning(categorias_table.c.id)
        )
        categoria_id = result.scalar_one()
        for sub_codigo, sub_nombre in subs:
            connection.execute(
                subcategorias_table.insert().values(
                    nombre=sub_nombre, codigo=sub_codigo, activo=True, categoria_id=categoria_id
                )
            )

    op.alter_column("categorias", "codigo", nullable=False)
    op.create_unique_constraint("uq_categorias_codigo", "categorias", ["codigo"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_categorias_codigo", "categorias", type_="unique")
    op.drop_column("productos", "subcategoria_id")
    op.drop_table("subcategorias")
    op.drop_column("categorias", "codigo")
