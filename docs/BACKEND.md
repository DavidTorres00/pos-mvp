# BACKEND.md

# Backend

## Arquitectura

```
app/
 api/
 core/
 database/
 models/
 schemas/
 repositories/
 services/
 modules/
   usuarios/
   productos/
   categorias/
   inventario/
   caja/
   compras/
   ventas/
   reportes/
```

## Responsabilidades
- API REST
- Lógica de negocio
- Persistencia
- Autenticación
- Reportes

## Convenciones
- Un módulo por dominio.
- Service contiene lógica.
- Repository acceso a datos.
- Schemas = entrada/salida.
- Models = ORM.

## Flujo
Modelo → Repository → Service → API → Frontend

## Calidad
- Tipado.
- Validaciones.
- Migraciones.
- Sin duplicación.
- Tests cuando el módulo esté terminado.

## Seguridad
- Auth: cookie httpOnly (`access_token`, JWT) + cookie legible (`csrf_token`). Login vía `auth_service.iniciar_sesion`, cookies las setea el router.
- CSRF: patrón double-submit (`app/core/csrf.py`, `CSRFMiddleware`). Todo método mutante exige header `X-CSRF-Token` == cookie `csrf_token`, o 403.
- RBAC: `Usuario.role` (`admin` | `cajero`), dependency `require_role` (`app/api/deps.py`). Admin-only: mutaciones de productos/categorías, `compras` completo, `reportes` completo, `POST /inventario/movimientos`. Cajero: ventas, caja completo, lectura del resto.
- Transacción por request: `get_db` commitea solo si el request completa sin excepción, rollback automático si falla algo — ninguna operación multi-paso (venta, compra) puede quedar a medias. Los repositorios ya no commitean individualmente, solo `flush()`.
- Concurrencia: `producto_repository.get_by_id_for_update` (`SELECT FOR UPDATE`) al mutar stock; índice único parcial `caja_sesiones (abierta) WHERE abierta=true` (una sola caja abierta, garantizado por la DB); `CHECK (stock >= 0)` en `productos`. Unicidad de nombre/SKU verificada con SAVEPOINT + traducción de `IntegrityError` al error de dominio (no solo pre-check en Python).
- Errores: handler global `IntegrityError`→409, `Exception`→500 JSON con logging (`app/main.py`) — nunca se expone un traceback crudo.

## Paginación
Los 6 endpoints de listado (`productos`, `categorias`, `compras`, `ventas`, `inventario/movimientos`, `caja/movimientos`) devuelven `Pagina[T]` (`app/schemas/pagination.py`): `{items, total, page, size}`. Query params `page`/`size` (`app/api/pagination.py`), paginación real vía `app/repositories/pagination.py`.

## Estado
Roadmap completo implementado.
- Login: `usuarios` (modelo, repository, service, router `/api/auth/login` + `/api/auth/me`), JWT sin refresh token, seed de admin vía `scripts/seed_admin.py` (rol admin explícito).
- Productos: `productos` (soft delete vía `activo`, router `/api/productos` — listar paginado con búsqueda `q`, crear/editar/cambiar estado admin-only).
- Categorías: `categorias` (mismo patrón, soft delete, nombre único, mutaciones admin-only). `Producto.categoria_id` opcional (FK), relación eager; crear/editar producto valida que la categoría exista.
- Inventario: `Producto.stock` cacheado (no editable desde el CRUD de producto). `movimientos_inventario` (entrada/salida) vía `inventario_service.registrar_movimiento` con lock de fila, valida stock suficiente en salidas. Router `/api/inventario/movimientos` — listar abierto a todos, crear movimiento manual admin-only.
- Caja: `caja_sesiones` (una sola abierta a la vez, forzado por índice único parcial) + `movimientos_caja` (entradas/salidas manuales de efectivo). `caja_service`: abrir/cerrar/resumen (monto esperado = inicial + ventas efectivo + entradas − salidas, diferencia al cierre informativa, no bloquea el cierre). Router `/api/caja/*`, abierto a cajero y admin.
- Compras: `compras`+`detalle_compras`, proveedor como texto libre. `compra_service.crear` calcula totales y genera automáticamente movimientos de entrada en Inventario por cada línea. Router admin-only (lectura y escritura).
- Ventas: `ventas`+`detalle_ventas`. `venta_service.crear` exige caja abierta (`CajaNoAbiertaError`), acumula cantidad por producto antes de validar stock (evita oversell con líneas duplicadas), congela `precio_unitario` del producto al momento de la venta, y genera automáticamente movimientos de salida en Inventario. Solo efectivo (sin métodos de pago múltiples). Abierto a cajero y admin.
- Reportes: sin modelos nuevos — `reporte_service` agrega ventas del día (`/api/reportes/ventas-dia`, fecha en UTC explícito) y resumen de caja actual o última cerrada (`/api/reportes/caja`), reusando `caja_service.resumen`. Router admin-only.
- Todas las rutas protegidas con JWT vía `dependencies=[Depends(get_current_user)]` a nivel de router, más `require_role` donde aplica (ver Seguridad).
