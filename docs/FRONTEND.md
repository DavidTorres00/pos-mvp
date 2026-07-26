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

## Estado
Roadmap completo implementado.
- Login: `features/auth` (schema zod, hook TanStack, LoginForm), `authStore` (zustand + persist), `LoginPage`/`DashboardPage`.
- Productos: `features/productos` (ProductoForm, ProductosTable), `ProductosPage` (búsqueda, alta/edición vía Dialog, activar/desactivar vía Switch, columnas Categoría y Stock).
- Categorías: `features/categorias` (mismo patrón), `CategoriasPage`.
- Inventario: `features/inventario` (MovimientoForm: selector de producto + tipo entrada/salida + cantidad + motivo, MovimientosTable), `InventarioPage`.
- Caja: `features/caja` (AperturaCajaForm, CierreCajaForm con resumen antes de confirmar, MovimientoCajaForm, MovimientosCajaTable), `CajaPage` (muestra apertura o resumen+movimientos según haya turno abierto).
- Compras: `features/compras` (CompraForm con líneas dinámicas vía `useFieldArray`: producto/cantidad/costo, total calculado), `ComprasPage` (tabla + detalle en Dialog).
- Ventas: `features/ventas` (VentaForm con líneas dinámicas: producto/cantidad, precio y subtotal de solo lectura), `VentasPage` — oculta el formulario y muestra aviso con link a `/caja` si no hay turno abierto (vía `useCajaActual`).
- Reportes: `ReportesPage` (sin carpeta `features/`, solo lectura) — tarjetas de ventas del día y resumen de caja.
- `ProtectedLayout` con nav completa: Dashboard, Productos, Categorías, Inventario, Caja, Compras, Ventas, Reportes, Cerrar sesión.
