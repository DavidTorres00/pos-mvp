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
   auditoria/
   configuracion/
   productos/
   categorias/
   inventario/
   caja/
   compras/
   proveedores/
   reglas_reorden/
   ordenes_reorden/
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
- RBAC: `Usuario.role` (`admin` | `cajero`), dependency `require_role` (`app/api/deps.py`). Admin-only: mutaciones de productos/categorías, `compras` completo, `proveedores` completo, `reglas-reorden`/`ordenes-reorden` completo, `configuracion` completo, `auditoria` completo, `usuarios` (gestión) completo, `reportes` completo, `POST /inventario/movimientos`. Cajero: ventas, caja completo (incluye `retirar-excedente` si tiene el permiso, ver más abajo), lectura del resto.
- Permiso fino por usuario: `Usuario.puede_retirar_excedente` (booleano, admin lo asigna por cajero vía `PATCH /usuarios/{id}/permisos`) habilita a un cajero puntual a ejecutar `POST /caja/retirar-excedente`; un admin siempre puede sin importar el flag.
- Transacción por request: `get_db` commitea solo si el request completa sin excepción, rollback automático si falla algo — ninguna operación multi-paso (venta, compra, aprobación de pago a proveedor) puede quedar a medias. Los repositorios ya no commitean individualmente, solo `flush()`.
  - Excepción deliberada: `auditoria_service.registrar_evento_independiente` abre su propia sesión y hace commit inmediato, para eventos que deben sobrevivir aunque la request termine en excepción (ej. login fallido, que siempre responde 401 y revertiría la transacción ambiente junto con el registro que se quiere conservar).
- Concurrencia: `producto_repository.get_by_id_for_update` (`SELECT FOR UPDATE`) al mutar stock; `caja_repository.get_abierta_for_update` al retirar excedente; `orden_reorden_repository.get_by_id_for_update` al aprobar un pago; `configuracion_repository.get_for_update` (lock de la fila única) al aprobar un pago a proveedor — serializa todas las aprobaciones concurrentes entre sí para que el tope de gasto diario no se pueda saltar por una carrera. Índices únicos parciales (no modelados en SQLAlchemy, cuidado con `alembic revision --autogenerate`: los marca como "removidos" por error, no tocar):
  - `caja_sesiones (abierta) WHERE abierta=true` — una sola caja abierta.
  - `ordenes_reorden (regla_reorden_id) WHERE estado='PENDIENTE'` — a lo sumo una orden pendiente por regla (idempotencia del disparo automático).
  - `CHECK (stock >= 0)` en `productos`.
  - Unicidad de nombre/SKU/CLABE-por-proveedor verificada con SAVEPOINT + traducción de `IntegrityError` al error de dominio (no solo pre-check en Python).
- Errores: handler global `IntegrityError`→409, `Exception`→500 JSON con logging (`app/main.py`) — nunca se expone un traceback crudo.

## Paginación
Los endpoints de listado (`productos`, `categorias`, `compras`, `ventas`, `proveedores`, `reglas-reorden`, `ordenes-reorden`, `usuarios`, `auditoria`, `inventario/movimientos`, `caja/movimientos`) devuelven `Pagina[T]` (`app/schemas/pagination.py`): `{items, total, page, size}`. Query params `page`/`size` (`app/api/pagination.py`), paginación real vía `app/repositories/pagination.py`.

## Estado
Roadmap completo implementado, incluida la fase de "sistema real de negocio" (auditoría, límite de caja, proveedores, reorden automático, pago a proveedor, forma de pago en ventas).

- Login: `usuarios` (modelo, repository, service, router `/api/auth/login` + `/api/auth/me`), JWT sin refresh token, seed de admin vía `scripts/seed_admin.py` (rol admin explícito). Login éxito/fallido queda registrado en `auditoria` (fallido con sesión independiente, ver Seguridad).
- Gestión de usuarios: `GET /api/usuarios` (admin, paginado) y `PATCH /api/usuarios/{id}/permisos` (admin, otorga/quita `puede_retirar_excedente`). No hay alta de usuarios vía API — se sigue creando por `seed_admin.py`/acceso directo a DB, fuera de alcance de esta fase.
- Auditoría (`app/models/auditoria.py`): tabla transversal `{usuario_id (nullable), accion, entidad, entidad_id, detalle JSON, created_at}`. Poblada desde los `service` en cada mutación relevante (login, producto: creación/cambio de precio/cambio de estado, apertura/cierre de caja, movimientos de caja, retiro de excedente, ventas, compras, proveedores, reglas y órdenes de reorden, pagos a proveedor). No reemplaza `usuario_id`/`created_at` de cada tabla de dominio — es el punto único de consulta "quién hizo qué" sin recorrer módulo por módulo. Endpoint `GET /api/auditoria` admin-only, filtros `usuario_id`/`entidad`/`desde`/`hasta`.
- Sesión de cajero: **no existe tabla `sesiones_usuario` nueva** (decisión YAGNI). Con una sola caja y normalmente un cajero a la vez, "quién estaba activo" se reconstruye cruzando `caja_sesiones.usuario_id` + los eventos `login_exitoso`/`login_fallido` de `auditoria`. Revisar si esto deja de alcanzar el día que haya más de un cajero simultáneo.
- Configuración de negocio (`app/models/configuracion_negocio.py`): fila única (id=1, creada por migración) con `limite_efectivo_caja`, `openpay_tope_por_orden`, `openpay_tope_diario`, editable en runtime sin redeploy vía `GET`/`PUT /api/configuracion` (admin-only). Distinto de `Settings`/`.env` (eso es config de despliegue: secretos, infra).
- Caja: `caja_sesiones` (una sola abierta a la vez) + `movimientos_caja` (ahora con `usuario_id` obligatorio — hueco crítico cerrado, ver migración `6c2f1f71c2ed`). `caja_service`: abrir/cerrar/resumen (monto esperado = inicial + ventas **en efectivo** + entradas − salidas; ventas con tarjeta/transferencia no suman al efectivo físico). `GET /api/caja/actual` devuelve además `efectivo_actual`, `limite_efectivo` y `excede_limite` (comparado contra `configuracion_negocio.limite_efectivo_caja`).
  - Retiro de excedente (`POST /api/caja/retirar-excedente`): si el efectivo supera el límite configurado, retira exactamente el excedente (deja la caja en el `monto_inicial`), genera el `MovimientoCaja` de salida correspondiente y un voucher (`VoucherRetiroOut`) con los datos para imprimir. Requiere `puede_retirar_excedente` o rol admin; usa lock de fila para que dos intentos concurrentes no dupliquen el retiro.
- Productos: `productos` (soft delete vía `activo`, router `/api/productos`). Cambios de precio y de estado quedan auditados con el valor anterior/nuevo (antes no dejaban rastro).
- Categorías: `categorias` (mismo patrón, soft delete, nombre único, mutaciones admin-only).
- Inventario: `Producto.stock` cacheado. `movimientos_inventario` vía `inventario_service.registrar_movimiento` con lock de fila. Tras cada **salida**, dispara `reorden_service.disparar_si_corresponde` (ver Reglas/Órdenes de reorden).
- Compras: `compras`+`detalle_compras`. `proveedor` ya **no** es texto libre — `Compra.proveedor_id` (FK a `Proveedor`, migrado desde el string histórico con backfill en `06348337ff00`). `compra_service.crear` valida el proveedor, calcula totales y genera movimientos de entrada en Inventario.
- Proveedores (`app/models/proveedor.py`): entidad real — `nombre` (único), `contacto`, `telefono`, `email`, `clabe` (CLABE interbancaria, usada por el pago automático vía OpenPay). CRUD admin-only en `/api/proveedores`, mismo patrón que `categorias`.
- Reglas de reorden (`app/models/regla_reorden.py`): una regla por producto (`producto_id` único) — `umbral_stock`, `cantidad_pedido`, `proveedor_id`, `costo_unitario_estimado` (no existe un "costo actual" canónico en `Producto`, el admin lo define al configurar la regla). CRUD admin-only en `/api/reglas-reorden`.
- Órdenes de reorden (`app/models/orden_reorden.py`): se crean automáticamente (`reorden_service.disparar_si_corresponde`, llamado desde `inventario_service` tras cada salida) cuando `producto.stock` llega al umbral de su regla activa. Idempotente vía índice único parcial (una PENDIENTE por regla). Estados: `pendiente → aprobada/rechazada/pagada/error`. `POST /api/ordenes-reorden/{id}/rechazar` (admin) descarta la sugerencia sin pagar. Listado filtrable por `estado` en `GET /api/ordenes-reorden`.
- Pago a proveedor vía OpenPay (§4.6, `app/services/pago_proveedor_service.py`): `POST /api/ordenes-reorden/{id}/aprobar` (admin) es la **única** forma de pagar — nunca automático sin esta llamada explícita (V1 confirmado con el cliente). Antes de pagar valida: orden pendiente, tope de gasto por orden y diario (`configuracion_negocio`, lock de fila para cerrar la carrera entre aprobaciones concurrentes), proveedor con CLABE cargada. Si OpenPay falla, la orden queda en estado `error` (con el mensaje) en vez de volver a `pendiente` — el admin decide si reintentar manualmente; la función no lanza excepción en ese caso (devuelve la orden con `estado=error`), porque lanzarla revertiría con la transacción de la request el propio registro de la falla.
  - **Sin el SDK oficial `openpay` (PyPI)**: ese paquete usa `use_2to3` y no compila en Python 3.13. Se implementó `app/core/openpay_client.py` llamando directo a la API REST de OpenPay (HTTP Basic Auth con la llave privada) vía `httpx` — dependencia nueva agregada con aprobación explícita del usuario para esta integración. El endpoint/payload de `payouts` sigue la documentación pública de OpenPay; no hay credenciales de sandbox en este entorno para verificarlo en vivo — **validar contra el sandbox real antes de aprobar la primera orden en producción**.
  - Credenciales en `Settings` (`OPENPAY_ID`, `OPENPAY_PRIVATE_KEY`, `OPENPAY_PRODUCTION`), sin configurar por defecto: la función falla con error claro en vez de intentar pagar.
- Ventas: `ventas`+`detalle_ventas`. `venta_service.crear` exige caja abierta, evita oversell, congela `precio_unitario`, genera movimientos de salida en Inventario, y ahora recibe `forma_pago` (`efectivo` | `tarjeta` | `transferencia`, default `efectivo`). Solo un método por ticket — no hay desglose de pago mixto en un mismo ticket (YAGNI: el cliente no confirmó necesitarlo, se agregaría una tabla `venta_pagos` si aparece esa necesidad). `caja_service` solo suma al efectivo físico las ventas con `forma_pago=efectivo`; tarjeta/transferencia se reportan aparte en `CajaResumenOut` pero no afectan `monto_esperado`. Sigue sin haber integración bancaria real — la terminal de tarjeta es un dispositivo físico aparte.
- Reportes: sin cambios funcionales — `reporte_service` sigue agregando ventas del día y resumen de caja.
- Todas las rutas protegidas con JWT vía `dependencies=[Depends(get_current_user)]` a nivel de router, más `require_role` donde aplica (ver Seguridad).
