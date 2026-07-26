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

## Estado
Roadmap completo implementado.
- Login: `usuarios` (modelo, repository, service, router `/api/auth/login` + `/api/auth/me`), JWT sin refresh token, seed de admin vía `scripts/seed_admin.py`.
- Productos: `productos` (soft delete vía `activo`, router `/api/productos` — listar con búsqueda `q`, crear, obtener, editar, cambiar estado).
- Categorías: `categorias` (mismo patrón, soft delete, nombre único). `Producto.categoria_id` opcional (FK), relación eager; crear/editar producto valida que la categoría exista.
- Inventario: `Producto.stock` cacheado (no editable desde el CRUD de producto). `movimientos_inventario` (entrada/salida) vía `inventario_service.registrar_movimiento`, valida stock suficiente en salidas. Router `/api/inventario/movimientos`.
- Caja: `caja_sesiones` (una sola abierta a la vez) + `movimientos_caja` (entradas/salidas manuales de efectivo). `caja_service`: abrir/cerrar/resumen (monto esperado = inicial + ventas efectivo + entradas − salidas, diferencia al cierre). Router `/api/caja/*`.
- Compras: `compras`+`detalle_compras`, proveedor como texto libre. `compra_service.crear` calcula totales y genera automáticamente movimientos de entrada en Inventario por cada línea.
- Ventas: `ventas`+`detalle_ventas`. `venta_service.crear` exige caja abierta (`CajaNoAbiertaError`), valida stock suficiente por línea, congela `precio_unitario` del producto al momento de la venta, y genera automáticamente movimientos de salida en Inventario. Solo efectivo (sin métodos de pago múltiples).
- Reportes: sin modelos nuevos — `reporte_service` agrega ventas del día (`/api/reportes/ventas-dia`) y resumen de caja actual o última cerrada (`/api/reportes/caja`), reusando `caja_service.resumen`.
- Todas las rutas protegidas con JWT vía `dependencies=[Depends(get_current_user)]` a nivel de router.
