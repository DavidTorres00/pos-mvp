# PROJECT.md

# MVP Punto de Venta (POS)

## Visión
Desarrollar un sistema POS moderno para pequeños comercios que permita administrar productos, inventario, compras, ventas, caja y reportes.

## Objetivo del MVP
El sistema debe permitir operar una tienda con una sola sucursal y un solo equipo.

## Fuera del alcance
- Multi sucursal
- Facturación electrónica
- E-commerce
- App móvil

## Stack Oficial
### Backend
- Python 3.13+
- FastAPI
- SQLAlchemy 2.x
- PostgreSQL 17
- Alembic
- JWT
- Docker

### Frontend
- React 19
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- React Router
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod

## Estructura

```
MVP_PV/
 backend/
 frontend/
 docs/
```

## Roadmap
Todo implementado. Orden real de construcción (Caja se adelantó a Compras/Ventas porque Ventas depende de tener una caja abierta):
1. Login
2. Productos
3. Categorías
4. Inventario
5. Caja
6. Compras
7. Ventas
8. Reportes

## Reglas
- Código limpio.
- DRY, KISS, YAGNI.
- Sin código muerto.
- Sin librerías nuevas sin aprobación.
- Cada tarea debe dejar el proyecto funcional.
- Backend y Frontend evolucionan juntos.
- Mantener esta documentación actualizada.
