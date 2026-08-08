# PROJECT.md

# MVP Punto de Venta (POS)

## Visión
**Cē POS**: producto de Soluciones Web (Cē), vendido como kit completo (software + hardware — impresora/lector/terminal) a comercios reales (abarrotes/súper), single-tenant por cliente — cada cliente corre su propia instalación aislada (base de datos + backend propios), nunca comparte datos con otro cliente. Reemplaza por completo un POS de terceros usado solo para cobrar: resuelve lo que ese nunca cubrió — inventario real, control remoto del dueño, auditoría de quién hizo qué, límite/control de efectivo en caja, multisucursal, y automatización de reorden + pago a proveedor. Ver `docs/CONTROL_PLANE.md` para el modelo de negocio (superuser, plan, aprovisionamiento de clientes nuevos).

## Objetivo
El sistema debe permitir operar uno o varios comercios (multisucursal, cada uno con sus propios equipos/cajas registradoras) con visibilidad y control remoto real para el dueño — no todo cliente necesita más de una sucursal, y el sistema se adapta sin pedir decisiones sin opciones reales (ver `docs/FRONTEND.md`, "admin de una sola sucursal").

## Fuera del alcance
- Facturación electrónica / CFDI.
- Recargas de tiempo aire, pago de servicios, pasarelas tipo MercadoPago/Prosepago.
- Integración bancaria directa — el cobro con tarjeta usa una terminal física (BBVA) independiente; el sistema solo registra método de pago + monto.
- Crédito a clientes / fiado.
- E-commerce
- App móvil
- Multi-tenant de base de datos compartida (varios clientes en una sola instalación) — decisión deliberada, ver `docs/CONTROL_PLANE.md`.

## Stack Oficial
### Backend
- Python 3.13+
- FastAPI
- SQLAlchemy 2.x
- PostgreSQL 17
- Alembic
- JWT
- Docker
- httpx (llamadas REST a OpenPay — el SDK oficial `openpay` de PyPI no compila en Python 3.13, ver `docs/BACKEND.md`)

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
Todo implementado.

### Fase 1 — MVP base
Orden real de construcción (Caja se adelantó a Compras/Ventas porque Ventas depende de tener una caja abierta):
1. Login
2. Productos
3. Categorías
4. Inventario
5. Caja
6. Compras
7. Ventas
8. Reportes

### Fase 2 — sistema real de negocio
Pedido explícito del cliente tras usar la Fase 1 en producción: auditoría, control de efectivo, proveedores reales y automatización de reorden/pago.
1. Auditoría transversal + fix de `movimientos_caja.usuario_id` (hueco crítico: no se sabía quién hacía un movimiento manual de caja).
2. Límite de efectivo por caja + retiro de excedente (voucher imprimible, permiso por cajero).
3. Sesión de cajero — resuelto sin tabla nueva (YAGNI), ver `docs/BACKEND.md`.
4. Proveedores como entidad real (reemplaza el texto libre en Compras).
5. Reglas de reorden automático + Órdenes de reorden.
6. Pago a proveedor vía OpenPay — V1 con aprobación admin obligatoria, nunca 100% automático.
7. Ventas con forma de pago (efectivo/tarjeta/transferencia).

### Fase 3 — catalogación real y consistencia de UI
Pedido explícito del cliente: el catálogo plano de categorías no reflejaba cómo se organiza el inventario real de una tienda de abarrotes, y el UI había crecido con inconsistencias visuales entre módulos.
1. Categorías → Subcategorías (2 niveles, código auto-secuencial), catálogo semilla de 12/62 desde `docs/info-categorias-productos.pdf`. SKU autogenerado al categorizar un producto por subcategoría.
2. Gestión de usuarios: alta de cajero vía API (antes solo por script/DB directa).
3. Auditoría de movimientos de inventario (hueco cerrado, no dejaban rastro) + fix de rango de fechas (`hasta` excluía el día actual) en Auditoría e Inventario.
4. `stock_resultante` en movimientos de inventario — snapshot histórico correcto, no el stock en vivo del producto.
5. Restricción de lectura admin-only en Categorías/Subcategorías/Inventario (antes visibles a cualquier logueado).
6. Unificación visual de todas las páginas de listado (`TableCard`, ancho fluido `w-full`, filtros con "Limpiar filtros", encabezados de tabla con fondo).

### Fase 4 — Multisucursal
`Sucursal`+`Equipo` (caja registradora física), stock movido de `Producto.stock` a `StockSucursal` (por producto×sucursal), Productos/Inventario/Compras scopeados a la sucursal activa del admin. Detalle completo en `docs/BACKEND.md`/`docs/FRONTEND.md` § Multisucursal.

### Fase 5 — Kiosko del cajero y control de caja
`VentaKiosco` (pantalla de venta real del cajero), límite de efectivo por caja con control de diferencia al cierre, eventos en tiempo real (SSE) para excedente/caja, feed de "Atención" para el admin.

### Fase 6 — Consolidación operativa
Control de stock `sin_stock` (alerta cuando no hay ninguna fila de `StockSucursal`, no solo cantidad en 0), hub de Productos organizado por categoría, pantalla de "servidor caído"/reconexión, impresión térmica de tickets/comprobantes vía QZ Tray, primer rebrand de paleta corporativa (azul, tokens muertos limpiados).

### Fase 7 — Devoluciones, cancelaciones y reportes
Devoluciones y cancelaciones de venta (ventana de 24h, permiso por cajero), utilidad/margen por costo congelado en cada línea de venta, consolidación del hub de Ventas en los 5 bloques actuales (KPIs/Tendencia/Sucursales/Atención/Top productos).

### Fase 8 — Modelo de negocio SaaS y consolidación de UI (Cē)
Pedido explícito: identificar la empresa detrás del producto y dejar el menú admin realmente consolidado, sin builds a medias.
1. Identidad de marca **Cē** — nombre, logo, favicon (paleta de color del producto sin cambios, es identidad propia del POS). Ver `docs/FRONTEND.md`.
2. Rol `superuser` + plan por instalación (cupo de equipos habilitados) + script de aprovisionamiento de clientes nuevos (`scripts/provisionar_cliente.py`). Modelo de negocio documentado en `docs/CONTROL_PLANE.md`.
3. Consolidación del menú admin: sin Dashboard/"Panel" separado (Ventas es la pantalla de entrada), Sucursales promovida a tab de primer nivel (antes escondida en "Ajustes").
4. Edición completa de cajero: activar/desactivar, resetear contraseña, cambiar de sucursal (bloqueado si tiene caja abierta) — antes solo se podía editar el nombre.
5. Reportes exportables: Ventas, Pagos y cobranza, Productos vendidos, Devoluciones y cancelaciones — un botón "Exportar" con las 4 opciones, CSV, respetando siempre los filtros activos del hub. Detalle en `docs/FRONTEND.md`/`docs/BACKEND.md` § Ventas.

## Reglas
- Código limpio.
- DRY, KISS, YAGNI.
- Sin código muerto.
- Sin librerías nuevas sin aprobación.
- Cada tarea debe dejar el proyecto funcional.
- Backend y Frontend evolucionan juntos.
- Mantener esta documentación actualizada.
