# FRONTEND.md

# Frontend

## Arquitectura

```
src/
 app/
 components/
 features/
   auth/
   caja/
   categorias/
   compras/
   configuracion/
   inventario/
   ordenes-reorden/
   productos/
   proveedores/
   reglas-reorden/
   subcategorias/
   usuarios/
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
- `authStore.usuario.role` (`admin` | `cajero`) refleja el rol que devuelve el backend; también trae `puede_retirar_excedente` (gatea el botón de retiro de excedente en `CajaPage` junto con el rol).
- `services/api.ts`: interceptor de request agrega header `X-CSRF-Token` leyendo la cookie `csrf_token` (requerido por el backend en todo método mutante).
- `ProtectedLayout`: nav agrupada por sección (Catálogo/Operación/Compras/Administración) y oculta para `cajero` todo lo admin-only: Categorías, Inventario, Compras, Proveedores, Reglas de reorden, Órdenes de reorden, Reportes, Auditoría, Usuarios, Configuración. El cajero solo ve Productos dentro de "Catálogo" — le alcanza para saber si hay stock, sin exponerle el árbol de categorización.
- Páginas admin-only siguen el mismo patrón: consulta gateada con `enabled: isAdmin` (nunca dispara el request bloqueado) + estado "No tienes acceso a este módulo" para cajero.
- Toggle activo/inactivo (`Categorias`/`Productos`/`Proveedores`/`ReglasReorden`Table): siempre pide confirmación vía `AlertDialog` antes de disparar la mutación. El mismo patrón se usa para "Aprobar y pagar" en `OrdenesReordenTable`, dado que mueve dinero real e irreversible.

## Paginación
Server-side: cada servicio de listado (`producto`, `categoria`, `subcategoria`, `compra`, `venta`, `proveedor`, `reglaReorden`, `ordenReorden`, `usuario`, `auditoria`, `inventario`, `caja`) recibe `{ page, size, ...filtros }` y devuelve `PaginatedResponse<T>` (`services/pagination.ts`) — `{items, total, page, size}`. `usePagination` solo trackea `page`/`size` local; la página lee `items`/`total` de la respuesta y se lo pasa a `Pagination.tsx`.

## Patrón de listados (`TableCard`)
Toda página con tabla (`Productos`, `Categorías`, `Proveedores`, `Reglas/Órdenes de reorden`, `Compras`, `Ventas`, `Usuarios`, `Auditoría`, `Caja`, `Inventario`) sigue el mismo esqueleto para evitar repetir el bloque loading/error/paginación en cada página:
- `components/TableCard.tsx`: envuelve la tabla en un card (`rounded-xl border bg-card shadow-sm`), muestra `LoadingState`/`ErrorState` mientras carga, y solo pinta el pie de paginación si `pageCount > 1` (antes había un bug donde el `div` de paginación quedaba vacío-pero-con-padding cuando `Pagination` devolvía `null` con una sola página — corregido ahí, una vez, para las ~12 páginas que lo usan).
- `EmptyState`/`ErrorState` (`components/DataStates.tsx`) aceptan `bordered?: boolean` (default `true`): en `false` cuando viven dentro de un `TableCard` (que ya tiene su propio borde), evita el doble marco.
- Cada `XTable.tsx` acepta `emptyMessage?: string` — la página decide el texto ("No hay X." vs "No hay X que coincidan con tu búsqueda.") según si hay algún filtro activo.
- Buscador: `Input` con `w-full max-w-sm` dentro de un contenedor `flex-1` (crece hasta ese tope, no infinito) — no `max-w-xs` fijo. Botón **"Limpiar filtros"** (ghost) aparece solo si `hayFiltrosActivos` es verdadero, resetea todos los filtros de esa página de un clic.
- `components/ui/table.tsx`: `TableHeader` lleva `bg-muted/50` — encabezados de columna con fondo gris sutil en toda la app, un solo lugar.
- Ancho de página: `w-full` (no `max-w-7xl` ni ningún cap fijo) en las páginas de tabla/lista y en el Dashboard — se adapta a cualquier monitor sin dejar espacio muerto a la derecha. Páginas de solo-mensaje ("No tienes acceso") o formulario de un campo se quedan angostas (`max-w-2xl`/`max-w-sm`) a propósito, por legibilidad.

## Impresión (voucher de retiro de excedente)
No se agregó ninguna librería de PDF/tickets: `VoucherRetiroDialog` renderiza el comprobante en un `div#voucher-print` y el botón "Imprimir" llama a `window.print()`. El aislamiento (que solo se imprima el voucher, no el resto de la app) se resuelve con una regla `@media print` global en `index.css` (`visibility: hidden` en todo excepto `#voucher-print`), no con una librería nueva.

## Estado
Roadmap completo implementado, incluida la fase de "sistema real de negocio".

- Login: `features/auth`, `authStore` (zustand + persist, incluye `role` y `puede_retirar_excedente`), `LoginPage`/`DashboardPage`.
- Categorías y Subcategorías (§ catalogación real): `Subcategorías` **no tiene ruta ni página propia** — se gestiona desde `CategoriasPage`, botón "Subcategorías" por fila abre `SubcategoriasDialog` (`features/subcategorias`) con la lista/alta/edición de esa categoría, mismo patrón `TableCard`. `ProductoForm` agrega select en cascada Categoría→Subcategoría (la subcategoría se filtra por la categoría elegida, se resetea si la categoría cambia); al crear con subcategoría elegida, el campo SKU se oculta (se autogenera en el backend) — en edición el SKU sigue siendo siempre editable. `ProductosTable`/`InventarioPage` muestran el breadcrumb `Categoría > Subcategoría` cuando existe, si no cae al `categoria` directo histórico.
- Inventario (admin-only, antes visible a cualquier logueado): columna "Stock actual" muestra `stock_resultante` del movimiento (snapshot histórico), no el stock en vivo del producto — mostrar el stock actual ahí rompía la coherencia del historial en cualquier producto con más de un movimiento. Entrada/Salida con ícono y color (`text-success`/`text-destructive`) y cantidad con signo (`+60`/`-20`). Filtros: búsqueda por nombre/SKU, tipo (Entrada/Salida), rango Desde/Hasta.
- Caja: `features/caja` — `useCajaActual` ahora devuelve `{ caja, efectivo_actual, limite_efectivo, excede_limite }` (no la caja directa). `CajaPage` muestra un banner cuando `excede_limite` con botón "Retirar excedente" (gateado por `puede_retirar_excedente` o rol admin) que abre `VoucherRetiroDialog` al confirmar. Resumen de caja desglosa ventas en efectivo vs. tarjeta/transferencia (estas últimas no cuentan para el monto esperado).
- Usuarios (`features/usuarios`, `UsuariosPage`, admin-only): tabla de usuarios con switch para otorgar/quitar `puede_retirar_excedente` por cajero (el admin siempre puede, no tiene switch).
- Auditoría (`features/auditoria`, `AuditoriaPage`, admin-only, solo lectura): filtros por módulo (`entidad`) y rango de fechas, tabla con usuario/evento/detalle. Sin formularios — mismo criterio que `ReportesPage` (feature simple, sin `components/` propios más allá de la página).
- Configuración (`features/configuracion`, `ConfiguracionPage`, admin-only): formulario único para `limite_efectivo_caja`, `openpay_tope_por_orden`, `openpay_tope_diario` (todos opcionales — vacío significa "sin tope").
- Compras: `CompraForm` cambió el campo de texto libre "Proveedor" por un `SelectField` poblado desde `useProveedores` (solo proveedores activos).
- Proveedores (`features/proveedores`, `ProveedoresPage`, admin-only): mismo patrón CRUD que `categorias` (form + tabla + toggle con confirmación), campos nombre/contacto/teléfono/email/CLABE.
- Reglas de reorden (`features/reglas-reorden`, `ReglasReordenPage`, admin-only): alta fija el producto (no se puede reasignar al editar, solo desactivar y crear una nueva regla); edición permite cambiar proveedor/umbral/cantidad/costo estimado.
- Órdenes de reorden (`features/ordenes-reorden`, `OrdenesReordenPage`, admin-only): filtro por estado (default "Pendientes"), acciones "Aprobar y pagar" (con `AlertDialog` de confirmación explícita, menciona que es un pago real e irreversible) y "Rechazar". Estado `error` muestra el mensaje de OpenPay en la fila.
- Ventas: `VentaForm` agrega selector de forma de pago (efectivo/tarjeta/transferencia, default efectivo); `VentasTable` y el detalle muestran la forma de pago.
- `ProtectedLayout` con nav condicionada por rol (ver Seguridad y roles).
