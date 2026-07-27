# pos-mvp

Sistema POS (Punto de Venta) para pequeños comercios de una sola sucursal. Gestiona productos, categorías, inventario, compras, ventas y caja, con reportes básicos. MVP funcional de extremo a extremo.

## Stack

**Backend**: Python 3.13+, FastAPI, SQLAlchemy 2.x, PostgreSQL 17, Alembic, JWT, uv.
**Frontend**: React 19, TypeScript, Vite, TailwindCSS, shadcn/ui, React Router, TanStack Query, Zustand, Axios, React Hook Form, Zod, pnpm.

## Estructura

```
pos-mvp/
 backend/    API REST (FastAPI + SQLAlchemy + Alembic)
 frontend/   SPA (React + Vite)
 docs/       Documentación del proyecto (PROJECT.md, BACKEND.md, FRONTEND.md)
```

## Requisitos

- Python 3.13+ con [uv](https://docs.astral.sh/uv/)
- Node.js con [pnpm](https://pnpm.io/)
- PostgreSQL 17 corriendo localmente

## Backend

```bash
createdb pos_db              # crear la base de datos (una sola vez)

cd backend
cp .env.example .env        # ajustar DATABASE_URL, JWT_SECRET, ADMIN_EMAIL/ADMIN_PASSWORD
uv sync
uv run alembic upgrade head
uv run python -m scripts.seed_admin   # crea el usuario admin inicial (rol admin)
uv run uvicorn app.main:app --reload
```

API disponible en `http://localhost:8000`, docs interactivas en `http://localhost:8000/docs`.

## Frontend

```bash
cd frontend
cp .env.example .env         # ajustar VITE_API_URL si el backend no corre en localhost:8000
pnpm install
pnpm dev
```

App disponible en `http://localhost:5173`.

## Roadmap

Completo: Login → Productos → Categorías → Inventario → Caja → Compras → Ventas → Reportes.

Detalle de arquitectura y estado de cada módulo en `docs/BACKEND.md` y `docs/FRONTEND.md`.

Control de acceso por rol: `admin` (todo) y `cajero` (ventas + caja, solo lectura del resto).

## Fuera de alcance (MVP)

Multi-sucursal, facturación electrónica, e-commerce, app móvil.

## Docker

`backend/Dockerfile` existe para despliegue/producción. El desarrollo local **no** usa Docker — corre directo contra Postgres local (ver pasos arriba).
