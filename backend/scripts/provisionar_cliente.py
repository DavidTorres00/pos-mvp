"""Aprovisiona una instalación nueva para un cliente: crea su base de datos, corre las
migraciones y siembra el superuser + admin iniciales con el cupo de equipos de su plan.

Mismo modelo single-tenant-por-cliente del resto del sistema (ver docs/BACKEND.md) — cada
cliente real es una corrida de este script contra su propia base, nunca una fila más en una
base compartida. Sin sucursales: esas las da de alta el propio admin del cliente después.

Uso:
    .venv/bin/python scripts/provisionar_cliente.py --db pos_cliente1 \
        --admin-email admin@cliente1.dev --admin-password Cliente1234 \
        --admin-nombre "Café Aroma" \
        --superuser-email super@solucionesweb.dev --superuser-password Super1234 \
        --limite-equipos 1
"""
import argparse
import os
import subprocess
import sys
from pathlib import Path

import psycopg
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))


def crear_base_si_no_existe(host: str, port: int, user: str, dbname: str) -> None:
    conn = psycopg.connect(host=host, port=port, user=user, dbname="postgres", autocommit=True)
    try:
        existe = conn.execute("SELECT 1 FROM pg_database WHERE datname = %s", (dbname,)).fetchone()
        if existe is None:
            conn.execute(f'CREATE DATABASE "{dbname}"')
            print(f"Base '{dbname}' creada.")
        else:
            print(f"Base '{dbname}' ya existía.")
    finally:
        conn.close()


def correr_migraciones(database_url: str) -> None:
    env = os.environ.copy()
    env["DATABASE_URL"] = database_url
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], cwd=BACKEND_DIR, env=env, check=True)


def _limpiar_sucursal_semilla(db, Sucursal, Equipo, CajaSesion, Usuario) -> None:
    """La migración d4e5f6a7b8c9 siembra 'Sucursal 1'/'Equipo 1' como backfill para la
    instalación original (que ya tenía cajeros/cajas antes de que existiera Multisucursal) — en
    un cliente nuevo de verdad ese placeholder es ruido que nadie pidió (acá el cliente da de
    alta su propia sucursal). No se toca la migración (es historia ya aplicada); esto es
    limpieza de aprovisionamiento, y solo actúa si la base sigue exactamente como la dejó la
    migración (nada la usó todavía) — si alguien ya operó con ella, no hace nada."""
    sucursal = db.query(Sucursal).filter_by(nombre="Sucursal 1").first()
    equipo = db.query(Equipo).filter_by(nombre="Equipo 1").first()
    if sucursal is None or equipo is None:
        return
    if db.query(Sucursal).count() != 1 or db.query(Equipo).count() != 1:
        return
    if db.query(CajaSesion).filter_by(equipo_id=equipo.id).count() > 0:
        return
    if db.query(Usuario).filter_by(sucursal_id=sucursal.id).count() > 0:
        return
    db.delete(equipo)
    db.delete(sucursal)
    db.flush()
    print("Sucursal/Equipo semilla (placeholder de la migración) eliminados — instalación nueva, sin sucursales.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--db", required=True, help="Nombre de la base de datos a crear/usar")
    parser.add_argument("--admin-email", required=True)
    parser.add_argument("--admin-password", required=True)
    parser.add_argument("--admin-nombre", default="Administrador")
    parser.add_argument("--superuser-email")
    parser.add_argument("--superuser-password")
    parser.add_argument("--limite-equipos", type=int, default=None, help="Vacío = sin límite")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=5432)
    parser.add_argument("--user", default="davidtorres")
    args = parser.parse_args()

    database_url = f"postgresql+psycopg://{args.user}@{args.host}:{args.port}/{args.db}"

    crear_base_si_no_existe(args.host, args.port, args.user, args.db)
    correr_migraciones(database_url)

    # import diferido: recién con la migración ya aplicada el modelo ORM coincide con el
    # esquema real de esta base nueva
    from app.core.security import hash_password
    from app.models.caja import CajaSesion
    from app.models.configuracion_negocio import CONFIGURACION_NEGOCIO_ID, ConfiguracionNegocio
    from app.models.equipo import Equipo
    from app.models.sucursal import Sucursal
    from app.models.usuario import RolUsuario, Usuario

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        _limpiar_sucursal_semilla(db, Sucursal, Equipo, CajaSesion, Usuario)

        if db.query(Usuario).filter_by(email=args.admin_email).first() is None:
            db.add(
                Usuario(
                    email=args.admin_email,
                    password_hash=hash_password(args.admin_password),
                    nombre=args.admin_nombre,
                    role=RolUsuario.ADMIN,
                    activo=True,
                )
            )
            print(f"Admin '{args.admin_email}' creado.")
        else:
            print(f"Admin '{args.admin_email}' ya existía, no se toca.")

        if args.superuser_email and args.superuser_password:
            if db.query(Usuario).filter_by(email=args.superuser_email).first() is None:
                db.add(
                    Usuario(
                        email=args.superuser_email,
                        password_hash=hash_password(args.superuser_password),
                        nombre="Soluciones Web",
                        role=RolUsuario.SUPERUSER,
                        activo=True,
                    )
                )
                print(f"Superuser '{args.superuser_email}' creado.")
            else:
                print(f"Superuser '{args.superuser_email}' ya existía, no se toca.")

        configuracion = db.get(ConfiguracionNegocio, CONFIGURACION_NEGOCIO_ID)
        configuracion.limite_equipos = args.limite_equipos
        db.commit()
        print(f"Plan de '{args.db}': limite_equipos={args.limite_equipos}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
