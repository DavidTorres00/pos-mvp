# PROJECT.md

# MVP Punto de Venta (POS)

## Visión
Sistema propio de negocio para una tienda real (abarrotes/súper), que reemplaza por completo un POS de terceros usado solo para cobrar. No es "competir" con ese POS — resuelve necesidades que nunca cubrió: inventario real, control remoto del dueño (vive en otro estado), auditoría de quién hizo qué, límite/control de efectivo en caja, y automatización de reorden + pago a proveedor.

## Objetivo
El sistema debe permitir operar una tienda con una sola sucursal y un solo equipo, con visibilidad y control remoto real para el dueño.

## Fuera del alcance
- Multi sucursal y rol `super_admin` (ver más abajo cómo no bloquear esa extensión futura).
- Facturación electrónica / CFDI (el cliente no factura).
- Recargas de tiempo aire, pago de servicios, pasarelas tipo MercadoPago/Prosepago.
- Integración bancaria directa — el cobro con tarjeta usa una terminal física (BBVA) independiente; el sistema solo registra método de pago + monto.
- Crédito a clientes / fiado (confirmado con el cliente que no aplica).
- E-commerce
- App móvil

## Diseño abierto a futuro: multi-sucursal
No implementado (una sola tienda hoy), pero lo construido no bloquea agregarlo después sin reescritura:
- `RolUsuario` es un enum simple — agregar `super_admin` es un valor más, siempre que la autorización use el enum y no asuma "solo existen 2 roles" en la lógica.
- `Auditoria.usuario_id` como actor generaliza solo cuando cada usuario pertenezca a una sucursal, sin cambiar el diseño de la tabla.
- `Producto.sku`, `Categoria.nombre`, `Proveedor.nombre` son únicos hoy a nivel de toda la base (correcto para una tienda). Si se agrega `sucursal_id`, esa unicidad probablemente pase a ser compuesta — no cambiar ahora, solo tenerlo identificado.
- Proveedores/reglas de reorden/OpenPay: no se hardcodeó en la lógica de negocio la suposición de "un solo lugar físico".

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

## Reglas
- Código limpio.
- DRY, KISS, YAGNI.
- Sin código muerto.
- Sin librerías nuevas sin aprobación.
- Cada tarea debe dejar el proyecto funcional.
- Backend y Frontend evolucionan juntos.
- Mantener esta documentación actualizada.
