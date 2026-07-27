# FRONTEND.md

# Frontend

## Arquitectura

```
src/
 app/
 components/
 features/
   auth/
   productos/
   categorias/
   inventario/
   caja/
   compras/
   ventas/
 hooks/
 services/
 stores/
 pages/
 layouts/
```

## Principios
- Feature-based.
- Componentes reutilizables.
- UI consistente.
- Consumir únicamente la API oficial.

## Estado Global
- Zustand

## Datos remotos
- TanStack Query

## Formularios
- React Hook Form + Zod

## Flujo
Pantalla → Hook → Service(API) → Backend

## Calidad
- Sin componentes huérfanos.
- Sin lógica compleja en componentes.
- Componentes pequeños y reutilizables.

## Seguridad y roles
- `authStore.usuario.role` (`admin` | `cajero`) refleja el rol que devuelve el backend.
- `services/api.ts`: interceptor de request agrega header `X-CSRF-Token` leyendo la cookie `csrf_token` (requerido por el backend en todo método mutante).
- `ProtectedLayout`: nav oculta Compras/Reportes para `cajero`.
- `ComprasPage`/`ReportesPage`: admin-only — consultas gateadas con `enabled: isAdmin` (nunca disparan el request bloqueado) y estado "No tenés acceso a este módulo" para cajero.
- `ProductosPage`/`CategoriasPage`/`InventarioPage`: controles de alta/edición/cambio de estado ocultos para no-admin (el backend ya los bloquea; la UI no debe ofrecer una acción que va a fallar).
- `ProductosTable`/`CategoriasTable`: el toggle activo/inactivo pide confirmación vía `AlertDialog` antes de disparar la mutación.

## Paginación
Server-side: cada servicio de listado (`producto`, `categoria`, `compra`, `venta`, `inventario`, `caja`) recibe `{ page, size, ...filtros }` y devuelve `PaginatedResponse<T>` (`services/pagination.ts`) — `{items, total, page, size}`. `usePagination` solo trackea `page`/`size` local; la página lee `items`/`total` de la respuesta y se lo pasa a `Pagination.tsx`.

## Estado
Roadmap completo implementado.
- Login: `features/auth` (schema zod, hook TanStack, `LoginForm` usa el `FormField` compartido), `authStore` (zustand + persist, incluye `role`), `LoginPage`/`DashboardPage`.
- Productos: `features/productos` (ProductoForm, ProductosTable), `ProductosPage` (búsqueda, alta/edición vía Dialog, activar/desactivar vía Switch + confirmación, columnas Categoría y Stock; gestión admin-only).
- Categorías: `features/categorias` (mismo patrón), `CategoriasPage`.
- Inventario: `features/inventario` (MovimientoForm: selector de producto + tipo entrada/salida + cantidad + motivo, MovimientosTable), `InventarioPage` (alta de movimiento manual admin-only).
- Caja: `features/caja` (AperturaCajaForm, CierreCajaForm con resumen antes de confirmar, MovimientoCajaForm, MovimientosCajaTable), `CajaPage` (muestra apertura o resumen+movimientos según haya turno abierto, con estado de error por cada query).
- Compras: `features/compras` (CompraForm con líneas dinámicas vía `useFieldArray`: producto/cantidad/costo, total calculado), `ComprasPage` (tabla + detalle en Dialog; admin-only).
- Ventas: `features/ventas` (VentaForm con líneas dinámicas: producto/cantidad, precio y subtotal de solo lectura), `VentasPage` — oculta el formulario y muestra aviso con link a `/caja` si no hay turno abierto (vía `useCajaActual`).
- Reportes: `ReportesPage` (sin carpeta `features/`, solo lectura, admin-only) — tarjetas de ventas del día y resumen de caja.
- `ProtectedLayout` con nav condicionada por rol: Dashboard, Productos, Categorías, Inventario, Caja, Ventas siempre visibles; Compras y Reportes solo para admin. Cerrar sesión siempre visible.
