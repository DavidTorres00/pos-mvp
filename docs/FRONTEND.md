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
   equipos/
   inventario/
   ordenes-reorden/
   productos/
   proveedores/
   reglas-reorden/
   subcategorias/
   sucursales/
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
- `ProtectedLayout`: nav agrupada por sección (Catálogo/Operación/Compras/Administración) y oculta para `cajero` todo lo admin-only: Categorías, Inventario, Compras, Proveedores, Reglas de reorden, Órdenes de reorden, Reportes, Auditoría, Usuarios, Sucursales, Configuración. El cajero solo ve Productos dentro de "Catálogo" — le alcanza para saber si hay stock, sin exponerle el árbol de categorización.
- Páginas admin-only siguen el mismo patrón: consulta gateada con `enabled: isAdmin` (nunca dispara el request bloqueado) + estado "No tienes acceso a este módulo" para cajero.
- Toggle activo/inactivo (`Categorias`/`Productos`/`Proveedores`/`ReglasReorden`Table): siempre pide confirmación vía `AlertDialog` antes de disparar la mutación. El mismo patrón se usa para "Aprobar y pagar" en `OrdenesReordenTable`, dado que mueve dinero real e irreversible.

## Paginación
Server-side: cada servicio de listado (`producto`, `categoria`, `subcategoria`, `compra`, `venta`, `proveedor`, `reglaReorden`, `ordenReorden`, `usuario`, `auditoria`, `inventario`, `caja`, `sucursal`, `equipo`) recibe `{ page, size, ...filtros }` y devuelve `PaginatedResponse<T>` (`services/pagination.ts`) — `{items, total, page, size}`. `usePagination` solo trackea `page`/`size` local; la página lee `items`/`total` de la respuesta y se lo pasa a `Pagination.tsx`.

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

- Login: `features/auth`, `authStore` (zustand + persist, incluye `role` y `puede_retirar_excedente`), `LoginPage`/`DashboardPage`. Tras login, `role=cajero` redirige a `/caja` (no al Dashboard, que es vista de admin). `LoginPage` usa `SplitBrandScreen` (ver abajo) — ya no la Card centrada chica original.
- `components/SplitBrandScreen.tsx`: layout compartido de pantalla completa (sin sidebar de la app) para las dos pantallas fuera del flujo normal: `LoginPage` y `AbrirCajaSplash`. El panel izquierdo es **puramente de marca** — "MVP POS" + tagline fija "Punto de venta", siempre igual sin importar la pantalla ni el usuario (la marca es la marca) — más un `footer` opcional (`LiveClock`, y en apertura de caja también "Último cierre"). Lo que cambia por pantalla (la acción, la info del cajero) vive del lado derecho vía `children`, con el patrón "eyebrow" (texto chico en mayúsculas, `text-primary`, ej. "Apertura de caja"/"Acceso al sistema") arriba del título grande — nunca en el panel de marca. Todo con tamaños fluidos vía `clamp()`, crece con el monitor en vez de topar a un ancho fijo. Deliberadamente **no** se aplicó este mismo enfoque fluido al resto de la app (listados/formularios ya resueltos con `w-full` + breakpoints estándar) — meterlo en tablas de trabajo densas en datos rompería la densidad de información, que ahí es lo que importa.
- `components/LiveClock.tsx`: reloj/fecha en vivo (hora del navegador) reutilizado por ambas pantallas de `SplitBrandScreen`.
- `ProtectedLayout` gatea por completo la app para `role=cajero` mientras no exista ninguna caja abierta (`useCajaActual`, ya no solo dentro de `CajaPage`): en vez del sidebar/nav normal, renderiza `AbrirCajaSplash` (`features/caja/components/AbrirCajaSplash.tsx`) — pantalla completa tipo kiosco, sin menú. El cajero llega a trabajar con su monto inicial ya contado; no tiene sentido dejarlo navegar antes de abrir caja. En cuanto la caja abre (por él o porque otro cajero/admin ya la tenía abierta), se muestra la app completa normal. Admin nunca se gatea así, siempre ve el Dashboard con sidebar.
  - Diseño de `AbrirCajaSplash` (a partir de un mockup del cliente, ahora sobre `SplitBrandScreen`): selector de **equipo** (`useEquiposDisponibles`, ver Multisucursal — con un solo equipo activo en la sucursal se autoselecciona y se muestra como etiqueta fija de solo lectura, sin pedir una decisión sin opciones reales) + input grande de monto con `$` + botones de monto rápido (500/1.500/1.000/3.000, azúcar de UI sin relación con ningún dato real, filtrados para no ofrecer un preset que ya de por sí supere `limite_efectivo_caja`) + hint de "Máx. {limite}" (dato real, oculto si no hay límite configurado) + "Último cierre" (dato real vía `caja_repository.get_ultima_cerrada_by_usuario`, campo `CajaActualOut.ultimo_cierre`) + reloj/fecha en vivo (solo hora del navegador, sin lógica de negocio), inyectados como `footer` de `SplitBrandScreen`. Se descartó del mockup original: "Turno" (no existe concepto de turnos en el sistema) — a diferencia de Terminal/Sucursal, sí llegaron a implementarse en Multisucursal.
  - Pendiente a futuro: disparar en ese mismo punto la activación de hardware (scanner de código de barras, terminal BBVA) — hoy no existe esa integración.
- Categorías y Subcategorías (§ catalogación real): `Subcategorías` **no tiene ruta ni página propia** — se gestiona desde `CategoriasPage`, botón "Subcategorías" por fila abre `SubcategoriasDialog` (`features/subcategorias`) con la lista/alta/edición de esa categoría, mismo patrón `TableCard`. `ProductoForm` agrega select en cascada Categoría→Subcategoría (la subcategoría se filtra por la categoría elegida, se resetea si la categoría cambia); al crear con subcategoría elegida, el campo SKU se oculta (se autogenera en el backend) — en edición el SKU sigue siendo siempre editable. `ProductosTable`/`InventarioPage` muestran el breadcrumb `Categoría > Subcategoría` cuando existe, si no cae al `categoria` directo histórico.
- Inventario (admin-only, antes visible a cualquier logueado): columna "Stock actual" muestra `stock_resultante` del movimiento (snapshot histórico), no el stock en vivo del producto — mostrar el stock actual ahí rompía la coherencia del historial en cualquier producto con más de un movimiento. Entrada/Salida con ícono y color (`text-success`/`text-destructive`) y cantidad con signo (`+60`/`-20`). Filtros: búsqueda por nombre/SKU, tipo (Entrada/Salida), rango Desde/Hasta.
- Caja: `features/caja` — `useCajaActual` devuelve `{ caja, efectivo_actual, limite_efectivo, excede_limite, ultimo_cierre }`, scopeada a "mi caja" en el backend (no la caja directa). `CajaPage` ya no tiene rama de apertura (`AperturaCajaForm` se eliminó por completo, era código inalcanzable: `AbrirCajaSplash` exige caja abierta antes de dejar pasar al cajero) — solo muestra la operación diaria. Banner cuando `excede_limite` con botón "Retirar excedente" (gateado por `puede_retirar_excedente` o rol admin) que abre `VoucherRetiroDialog` al confirmar. Resumen de caja desglosa ventas en efectivo vs. tarjeta/transferencia (estas últimas no cuentan para el monto esperado). Encabezado muestra "Caja abierta por {usuario_nombre} desde {fecha}" — antes no identificaba quién la abrió, ambiguo para un cajero distinto que entrara a mirarla. `AbrirCajaSplash` propaga el error de `MontoInicialExcedeLimiteError` (400) si el monto inicial supera el límite configurado, y `EquipoNoDisponibleError`/`EquipoOcupadoError` si el equipo elegido no sirve — el backend bloquea, no solo advierte.
- Usuarios (`features/usuarios`, `UsuariosPage`, admin-only): tabla de usuarios con switch para otorgar/quitar `puede_retirar_excedente` por cajero (el admin siempre puede, no tiene switch), más columna "Sucursal" (`sucursal_nombre`). Alta de cajero (`UsuarioForm`) exige elegir sucursal (`SelectField` poblado por `useSucursales`, activas únicamente) — mismo idioma que `CompraForm` usa para proveedor: `sucursal_id: z.number().nullable()` + `.superRefine` que exige no-null al enviar, no un simple `.min(1)` de string. Columna "Caja" muestra `usuario.caja_activa` (punto verde/gris, "Caja activa"/"Sin caja") — desde Multisucursal puede haber varios cajeros en verde a la vez (N cajas abiertas). Deliberadamente no es "está logueado": un login sin caja abierta no importa para el control de efectivo, que es lo que esto resuelve.
- Logout (`features/auth/hooks/useLogout.ts`): `clearSession()` solo en `onSuccess` (antes era `onSettled`, limpiaba la sesión local aunque el backend rechazara el logout). Si el usuario tiene su caja abierta, el backend responde 409 y `ProtectedLayout` muestra el mensaje de error bajo el botón "Cerrar sesión" sin desloguear localmente — evita que la UI muestre "deslogueado" mientras la cookie sigue viva en el servidor.
- Auditoría (`features/auditoria`, `AuditoriaPage`, admin-only, solo lectura): filtros por módulo (`entidad`) y rango de fechas, tabla con usuario/evento/detalle. Sin formularios — mismo criterio que `ReportesPage` (feature simple, sin `components/` propios más allá de la página).
- Configuración (`features/configuracion`, `ConfiguracionPage`, admin-only): formulario único para `limite_efectivo_caja`, `openpay_tope_por_orden`, `openpay_tope_diario` (todos opcionales — vacío significa "sin tope").
- Compras: `CompraForm` cambió el campo de texto libre "Proveedor" por un `SelectField` poblado desde `useProveedores` (solo proveedores activos).
- Proveedores (`features/proveedores`, `ProveedoresPage`, admin-only): mismo patrón CRUD que `categorias` (form + tabla + toggle con confirmación), campos nombre/contacto/teléfono/email/CLABE.
- Reglas de reorden (`features/reglas-reorden`, `ReglasReordenPage`, admin-only): alta fija el producto (no se puede reasignar al editar, solo desactivar y crear una nueva regla); edición permite cambiar proveedor/umbral/cantidad/costo estimado.
- Órdenes de reorden (`features/ordenes-reorden`, `OrdenesReordenPage`, admin-only): filtro por estado (default "Pendientes"), acciones "Aprobar y pagar" (con `AlertDialog` de confirmación explícita, menciona que es un pago real e irreversible) y "Rechazar". Estado `error` muestra el mensaje de OpenPay en la fila.
- Ventas: `VentaForm` agrega selector de forma de pago (efectivo/tarjeta/transferencia, default efectivo); `VentasTable` y el detalle muestran la forma de pago.
- `ProtectedLayout` con nav condicionada por rol (ver Seguridad y roles). `NavItem.cajeroOnly` (además de `adminOnly`): "Caja" ya no aparece en el nav del admin — con el splash de apertura (`AbrirCajaSplash`) es un flujo fijo/obligatorio del cajero, no algo que el admin gestione desde el menú.
- Corte de caja de emergencia desde `UsuariosPage`: en vez de mandar al admin a la ruta `/caja` (sin acceso en su nav), el botón "Cerrar caja" vive directo en la fila del cajero con `caja_activa` en `UsuariosTable` — reutiliza `CierreCajaForm` de `features/caja`, pero contra `useCajaDeUsuario(usuarioId)`/`useCerrarCajaDeUsuario()` (`GET`/`POST /usuarios/{id}/caja...`, scopeados al cajero del path, no al admin que llama) en vez de `useCajaActual`/`useCerrarCaja` — esos quedaron atados al usuario que llama tras el rescoping de Multisucursal, y el admin nunca tiene caja propia. `useCerrarCajaDeUsuario` invalida también `['usuarios']` para que el punto verde se apague al instante sin recargar.
- `CajaPage` bloqueada para `role=admin` (mensaje + link a Usuarios) — no solo se quitó del nav, la ruta en sí ya no muestra "Abrir caja" ni nada de operación diaria si el admin entra por URL directa. Único caso de uso del admin con caja (corte de emergencia) resuelto desde Usuarios.
- Multisucursal (diseño completo y rationale en `docs/MULTISUCURSAL.md`):
  - `features/sucursales`/`features/equipos` + `pages/SucursalesPage.tsx` (admin-only, en `/sucursales`): copia exacta del patrón `proveedores` (sucursales) y `subcategorias` (equipos — botón "Equipos" por fila abre `EquiposDialog`, mismo esqueleto que `SubcategoriasDialog`).
  - `stores/sucursalActivaStore.ts` (zustand + persist, solo `sucursalId`) + `components/SucursalActivaSelector.tsx`: selector visible para `admin` en Productos/Inventario/Compras/Reglas/Órdenes de reorden — pantallas que muestran/mutan stock, y el admin no pertenece a ninguna sucursal. Se autoselecciona la primera sucursal activa si no hay ninguna elegida. El `cajero` nunca ve este selector — su `sucursal_id` se resuelve siempre en el servidor (`resolve_sucursal_id`), el valor del store simplemente se ignora si viaja.
  - `useProductos`/`useMovimientos`/`useCompras`/`useReglasReorden`/`useOrdenesReorden` leen `sucursalActivaStore` internamente (no cada pantalla se lo pasa por props) e incluyen el `sucursalId` en su `queryKey` — cambiar de sucursal en el selector invalida y recarga automáticamente.
  - `services/productoService.ts`: `Producto` (catálogo puro) vs. `ProductoConStock` (+ `stock`, solo para el listado/detalle de `/productos`) — refleja el mismo split que el backend (`ProductoOut`/`ProductoStockOut`), porque el stock ya no es un campo fijo del producto sino de producto×sucursal.
  - `DashboardPage`/`ReportesPage`: la tarjeta "Estado de caja"/"Resumen de caja" (singulares) se reemplazaron por un agregado ("N cajas abiertas, $X esperado en total") para admin y una lista (una entrada por caja abierta) respectivamente, sobre `GET /reportes/cajas-abiertas` — con N cajas no hay "la actual" singular. Para `cajero`, `DashboardPage` sigue igual (ahora correctamente auto-escopeada a su propia caja).
