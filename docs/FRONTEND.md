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
- `ProtectedLayout`: nav oculta para `cajero` todo lo admin-only: Compras, Proveedores, Reglas de reorden, Órdenes de reorden, Reportes, Auditoría, Usuarios, Configuración.
- Páginas admin-only siguen el mismo patrón: consulta gateada con `enabled: isAdmin` (nunca dispara el request bloqueado) + estado "No tenés acceso a este módulo" para cajero.
- Toggle activo/inactivo (`Categorias`/`Productos`/`Proveedores`/`ReglasReorden`Table): siempre pide confirmación vía `AlertDialog` antes de disparar la mutación. El mismo patrón se usa para "Aprobar y pagar" en `OrdenesReordenTable`, dado que mueve dinero real e irreversible.

## Paginación
Server-side: cada servicio de listado (`producto`, `categoria`, `compra`, `venta`, `proveedor`, `reglaReorden`, `ordenReorden`, `usuario`, `auditoria`, `inventario`, `caja`) recibe `{ page, size, ...filtros }` y devuelve `PaginatedResponse<T>` (`services/pagination.ts`) — `{items, total, page, size}`. `usePagination` solo trackea `page`/`size` local; la página lee `items`/`total` de la respuesta y se lo pasa a `Pagination.tsx`.

## Impresión (voucher de retiro de excedente)
No se agregó ninguna librería de PDF/tickets: `VoucherRetiroDialog` renderiza el comprobante en un `div#voucher-print` y el botón "Imprimir" llama a `window.print()`. El aislamiento (que solo se imprima el voucher, no el resto de la app) se resuelve con una regla `@media print` global en `index.css` (`visibility: hidden` en todo excepto `#voucher-print`), no con una librería nueva.

## Estado
Roadmap completo implementado, incluida la fase de "sistema real de negocio".

- Login: `features/auth`, `authStore` (zustand + persist, incluye `role` y `puede_retirar_excedente`), `LoginPage`/`DashboardPage`.
- Productos / Categorías / Inventario: sin cambios de fondo en esta fase.
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
