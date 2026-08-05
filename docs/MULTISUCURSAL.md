# MULTISUCURSAL.md

Documento autosuficiente: diseño completo de la expansión a múltiples sucursales y múltiples equipos (cajas físicas) por sucursal. No depende de contexto de conversación — cualquiera que lea esto debe poder implementarlo o retomarlo sin más información.

## Por qué

El sistema se construyó para una sola tienda, un solo equipo (ver `docs/PROJECT.md`, ahora desactualizado en ese punto). El negocio real va a operar más de una sucursal — posiblemente en distintos estados de México, lo que descarta de entrada compartir inventario físico entre ellas (no se puede "prestar" stock entre tiendas en estados distintos en tiempo real dentro del sistema). Se decidió construir el soporte real ahora, en dos fases secuenciales, en vez de parchear el límite de "una sola caja abierta en todo el sistema" que bloqueaba probar con más de un cajero simultáneo.

## Decisión de fondo: qué se comparte entre sucursales y qué no

- **Catálogo compartido**: `Producto`, `Categoria`, `Subcategoria`, `Proveedor` siguen siendo los mismos en todas las sucursales (mismo SKU, mismo nombre, mismo proveedor visto desde cualquier tienda). Así operan las cadenas reales — no se re-inventa el catálogo por tienda. Sin cambios a la unicidad de `Producto.sku` / `Categoria.nombre` / `Proveedor.nombre` (siguen únicos a nivel global).
- **Stock separado por sucursal**: la cantidad física de cada producto SÍ es distinta por tienda — es lo que obliga la separación geográfica real. Esto es el trabajo de Fase 2.
- **Caja separada por cajero y por equipo físico**: cada sucursal puede tener N equipos (cajas registradoras), cada cajero abre su propia caja en un equipo — trabajo de Fase 1.
- **Sin nuevo rol**: `admin` sigue siendo uno solo, viendo/administrando todas las sucursales de forma remota (no existe "admin de sucursal" ni `super_admin` — no se necesita con un solo dueño remoto). `cajero` pertenece a exactamente una sucursal.

## Nombrado: por qué "Equipo" y no "Terminal"

El negocio ya usa la palabra "terminal" para la terminal física de cobro con tarjeta (BBVA) — ver `docs/PROJECT.md` ("el cobro con tarjeta usa una terminal física (BBVA) independiente") y comentarios en `caja_service.py`. Nombrar la caja registradora física también "Terminal" chocaría con ese significado ya establecido. Se usa **`Equipo`** — coincide además con el lenguaje que usó el cliente ("sus números de equipos (cajas) que tendrá en cada una").

---

# Fase 1 — Sucursales, Equipos, caja multi-cajero (implementar primero)

## Modelos nuevos

```python
# app/models/sucursal.py
class Sucursal(Base):
    __tablename__ = "sucursales"
    id: int (PK)
    nombre: str(255), unique, nullable=False
    activo: bool, default=True, nullable=False
    created_at: DateTime(timezone=True), server_default=func.now()
```

```python
# app/models/equipo.py
class Equipo(Base):
    __tablename__ = "equipos"
    __table_args__ = (UniqueConstraint("sucursal_id", "nombre", name="uq_equipos_sucursal_nombre"),)
    id: int (PK)
    sucursal_id: int  FK -> sucursales.id, nullable=False
    nombre: str(255), nullable=False
    activo: bool, default=True, nullable=False
    created_at: DateTime(timezone=True), server_default=func.now()

    sucursal: Mapped[Sucursal] = relationship(lazy="joined")
```

## Modelos modificados

**`app/models/usuario.py`**: agregar
```python
sucursal_id: Mapped[int | None] = mapped_column(ForeignKey("sucursales.id"), nullable=True)
sucursal: Mapped[Sucursal | None] = relationship(lazy="joined")
```
Nullable porque `admin` no pertenece a ninguna sucursal (ve todas remotamente). Para `cajero` es obligatorio — forzado por un CHECK constraint, no solo por validación de aplicación:
```sql
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_cajero_requiere_sucursal
  CHECK (role != 'cajero' OR sucursal_id IS NOT NULL);
```
(mismo patrón que el `CHECK (stock >= 0)` ya existente en `productos`, migración `a1b2c3d4e5f6`).

**`app/models/caja.py`**: agregar
```python
equipo_id: Mapped[int] = mapped_column(ForeignKey("equipos.id"), nullable=False)
equipo: Mapped[Equipo] = relationship(lazy="joined")

@property
def equipo_nombre(self) -> str:
    return self.equipo.nombre
```
(mismo patrón ya usado para `usuario`/`usuario_nombre` en este mismo modelo).

## Migración (un solo archivo, orden importa)

Sigue el patrón ya usado en `f39b82803b11` (creación de subcategorías): agregar columna nullable → backfill con datos existentes → endurecer a NOT NULL/agregar constraint. Nunca agregar NOT NULL directo sobre una tabla con filas existentes.

1. Crear tabla `sucursales`. Insertar una fila semilla: `nombre='Sucursal 1'` — nombre deliberadamente genérico/placeholder, NO se inventa un nombre real de tienda. El admin la renombra desde el nuevo CRUD apenas migre.
2. Crear tabla `equipos`. Insertar una fila semilla `nombre='Equipo 1'`, `sucursal_id` = la sucursal semilla.
3. `ALTER TABLE usuarios ADD COLUMN sucursal_id ... NULL` → `UPDATE usuarios SET sucursal_id = <semilla> WHERE role = 'cajero'` → agregar el CHECK constraint de arriba.
4. `ALTER TABLE caja_sesiones ADD COLUMN equipo_id ... NULL` → `UPDATE caja_sesiones SET equipo_id = <equipo semilla>` (todas las filas, históricas y actuales) → `ALTER COLUMN equipo_id SET NOT NULL` → agregar FK.
5. **Drop** el índice único parcial global `ix_caja_sesiones_una_abierta` (en `abierta` sola). Crear dos nuevos:
   ```sql
   CREATE UNIQUE INDEX ix_caja_sesiones_una_abierta_por_equipo
     ON caja_sesiones (equipo_id) WHERE abierta = true;
   CREATE UNIQUE INDEX ix_caja_sesiones_una_abierta_por_usuario
     ON caja_sesiones (usuario_id) WHERE abierta = true;
   ```
   Esto permite N cajas abiertas simultáneamente (una por equipo, una por cajero), preservando ambas garantías de negocio: nadie duplica un cajero activo, nadie duplica un equipo ocupado.

   **Advertencia recurrente en este proyecto** (ya documentada en `docs/BACKEND.md` para los índices únicos parciales existentes): `alembic revision --autogenerate` va a marcar estos índices como "removidos por error" en cualquier migración futura no relacionada — no aceptar ese diff sin revisarlo, igual que con `ix_ordenes_reorden_una_pendiente_por_regla`.

## `app/repositories/caja_repository.py` — cambios de scoping

Hoy, "cuál caja está abierta" es una pregunta sin parámetros (`get_abierta(db)`) porque solo puede existir una en todo el sistema. Con N equipos y N cajeros, la pregunta correcta para las acciones del día a día de un cajero es **"cuál es MI caja abierta"** (por `usuario_id`) — el equipo donde la abrió es un dato que se graba una sola vez al abrir y no se necesita volver a consultar para vender, registrar movimientos, o cerrar (un cajero solo puede estar físicamente en un lugar a la vez).

| Función actual | Reemplazo |
|---|---|
| `get_abierta(db)` | `get_abierta_by_usuario(db, usuario_id)` |
| `get_abierta_for_update(db)` | `get_abierta_for_update_by_usuario(db, usuario_id)` |
| `get_ultima_cerrada(db)` | `get_ultima_cerrada_by_usuario(db, usuario_id)` |
| — (nueva) | `get_abierta_by_equipo(db, equipo_id)` — solo para el pre-check de `abrir()` |
| — (nueva) | `get_abiertas(db) -> list[CajaSesion]` — sin filtro, todas las cajas abiertas ahora. Usada donde se necesita el conjunto completo, no una sola: `usuario_service.listar` (columna "Caja activa"), `reporte_service` (reemplazo del reporte de caja), `DashboardPage` para admin. |

## `app/services/caja_service.py`

**`abrir(db, usuario_id, equipo_id, monto_inicial)`** (firma cambia, agrega `equipo_id`):
1. Cargar `equipo`; si no existe o `activo=False` → `EquipoNoDisponibleError`.
2. Si `equipo.sucursal_id != usuario.sucursal_id` → `EquipoNoDisponibleError` (validación **server-side** — el filtrado del dropdown en frontend es solo UX, no seguridad; sin este chequeo, un cliente modificado podría abrir una caja en un equipo de otra sucursal).
3. Pre-check `get_abierta_by_usuario(db, usuario_id) is not None` → `CajaYaAbiertaError` ("ya tienes una caja abierta").
4. Pre-check `get_abierta_by_equipo(db, equipo_id) is not None` → nuevo `EquipoOcupadoError` ("ese equipo ya está en uso").
5. Validar `monto_inicial` contra `limite_efectivo_caja` (sin cambios, ya existe).
6. Insertar dentro de `db.begin_nested()`, catch genérico de `IntegrityError` → re-lanzar `CajaYaAbiertaError` con mensaje genérico (es solo el respaldo de una carrera entre el pre-check y el insert; los mensajes precisos ya los dieron los pre-checks del 90%+ de los casos — no vale la pena parsear `constraint_name` del driver para un caso tan raro).

**`obtener_actual(db, usuario_id)`**, **`registrar_movimiento(db, usuario_id, ...)`**, **`retirar_excedente(db, usuario)`**: cambian su lookup interno a `get_abierta_by_usuario`/`get_abierta_for_update_by_usuario`. El `ultimo_cierre` que expone `obtener_actual` (usado por `AbrirCajaSplash`) pasa a `get_ultima_cerrada_by_usuario` — es "la última vez que ESTE cajero cerró", no de un equipo en particular (simplificación deliberada: un cajero puede rotar de equipo entre turnos, lo relevante para él es su propio historial, no el del fierro).

**`cerrar(db, actor_id, target_usuario_id, monto_final)`** (firma cambia — dos ids, no uno): busca la caja de `target_usuario_id` vía `get_abierta_by_usuario`, pero audita el evento con `actor_id`. Cubre los dos casos con una sola función:
- Cajero cerrando la suya: `actor_id == target_usuario_id`.
- Admin cerrando la de otro cajero (emergencia, ya existía esta capacidad, ver `UsuariosPage`): `actor_id` = admin, `target_usuario_id` = el cajero.

**`app/services/venta_service.py`**: `crear()` cambia su llamada `caja_service.obtener_abierta(db)` por la versión scopeada al `usuario_id` que está vendiendo — cada venta se ata a la caja del cajero que la registra, no a "la" caja global.

**`app/services/auth_service.py`**: `cerrar_sesion()` hoy hace `get_abierta(db)` y filtra en Python (`caja.usuario_id == usuario.id`) para decidir si bloquear el logout. Cambia a `get_abierta_by_usuario(db, usuario.id) is not None` directo — mismo comportamiento, sin el paso intermedio que dejaba de tener sentido con N cajas abiertas.

**`app/services/usuario_service.py`**: `listar()` construye el flag `caja_activa` de cada fila con un solo `set` de `usuario_id`s sacado de `get_abiertas(db)` — evita N+1 (una consulta por fila).

**`app/services/reporte_service.py`**: `caja_actual_o_ultima(db) -> CajaResumenOut` (una sola caja, con fallback a "la última cerrada" si no hay ninguna abierta) deja de tener sentido — con N cajas no hay una "la actual" singular. Se reemplaza por:
```python
def cajas_abiertas(db: Session) -> list[CajaResumenOut]:
    return [caja_service.resumen(db, c.id) for c in caja_repository.get_abiertas(db)]
```
Si no hay ninguna abierta: lista vacía. Se pierde el fallback "última cerrada" que existía hoy — decisión deliberada de Fase 1 (con N equipos, "la última cerrada" de cuál de todos ya no es una pregunta con una sola respuesta razonable; un reporte de cierres históricos por sucursal/equipo es una mejora aparte, no bloqueante, no incluida aquí).

**`app/services/usuario_service.py`**: `crear()` gana parámetro `sucursal_id: int` (requerido) — se pasa directo al modelo al crear un cajero. Si el id no existe, la FK falla con `IntegrityError` → ya cubierto por el handler global existente (`IntegrityError` → 409) — no se necesita una excepción de dominio nueva para esto.

## Endpoints

- **`app/modules/sucursales/router.py`** (nuevo): CRUD plano en `/sucursales`, admin-only (`dependencies=[Depends(require_role(RolUsuario.ADMIN))]` a nivel router, igual que `/usuarios`). Mismo patrón exacto que `app/modules/proveedores/router.py`: `GET` paginado, `POST` crear, `PUT`/`PATCH` editar, `PATCH /{id}/estado` toggle activo.
- **`app/modules/equipos/router.py`** (nuevo): CRUD plano en `/equipos`, admin-only. `GET /equipos?sucursal_id=<id>` (query param **opcional**, no ruta anidada) y `POST /equipos` con `sucursal_id` en el body — mismo patrón exacto que `app/modules/subcategorias/router.py` (que es flat con `categoria_id` opcional/en body, **no** `/categorias/{id}/subcategorias` — verificado directo en el código, no es una ruta anidada aunque el frontend lo presente como diálogo por fila).
- **`app/modules/caja/router.py`**:
  - `POST /caja/abrir`: el payload (`CajaAbrirRequest`) agrega `equipo_id: int`. La dependencia de la ruta agrega `Depends(require_role(RolUsuario.CAJERO))` — hoy es solo `get_current_user`, lo que en teoría deja a un admin abrir caja (nunca pasa en la práctica porque el admin no tiene `sucursal_id`, pero es mejor forzar el invariante en la ruta que confiar en que nunca se dé el caso).
  - Nuevo `GET /caja/equipos-disponibles`: solo requiere `get_current_user` (cualquier cajero autenticado, no admin-only) — devuelve los equipos de `current_user.sucursal_id` con `activo=true`. Usado por el picker de equipo en `AbrirCajaSplash`.
- **`app/modules/usuarios/router.py`** (ya admin-only a nivel router): nuevos `GET /usuarios/{id}/caja` (reusa `CajaActualOut`, scopeado al `id` del path, no al que llama) y `POST /usuarios/{id}/caja/cerrar` (reusa `CajaCerrarRequest`/`CajaResumenOut`, llama a `caja_service.cerrar(db, actor_id=admin.id, target_usuario_id=id, monto_final=...)`). Reemplazan la dependencia de hoy en `UsuariosPage` de los endpoints globales `/caja/actual`/`/caja/cerrar`, que solo "funcionaban" para el admin por accidente (al no haber más de una caja, cualquier lookup sin filtro devolvía la única que existiera).
- **`app/modules/reportes/router.py`**: `GET /reportes/caja` (devolvía `CajaResumenOut`) → `GET /reportes/cajas-abiertas` (`response_model=list[CajaResumenOut]`).

## Schemas

- `app/schemas/sucursal.py`, `app/schemas/equipo.py`: mismo shape que `proveedor.py`/`subcategoria.py` (`...Create`, `...Out` con `from_attributes=True`, `...EstadoUpdate` si aplica el patrón de toggle).
- `CajaOut` (en `app/schemas/caja.py`): agrega `equipo_id: int`, `equipo_nombre: str`.
- `CajaAbrirRequest`: agrega `equipo_id: int`.
- `UsuarioCreate` (en `app/schemas/usuario.py`): agrega `sucursal_id: int` (requerido — el único endpoint de creación de usuarios ya solo crea cajeros).
- `UsuarioOut`: agrega `sucursal_id: int | None`, `sucursal_nombre: str | None` (vía relationship, mismo patrón que `usuario_nombre` en `CajaOut`).

## Frontend

**Nuevo:**
- `services/sucursalService.ts`, `services/equipoService.ts`.
- `features/sucursales/{components/{SucursalForm.tsx,SucursalesTable.tsx},hooks/{useSucursales.ts,useSucursalMutations.ts},schemas/sucursalSchema.ts}` — copia exacta del patrón de `features/proveedores/` (ver ese directorio completo como plantilla: página standalone, `useResourceList`/`useApiMutation`/`useOptimisticToggle` genéricos, cero código nuevo de plumbing).
- `features/equipos/{components/{EquipoForm.tsx,EquiposTable.tsx,EquiposDialog.tsx},hooks/{useEquipos.ts,useEquipoMutations.ts},schemas/equipoSchema.ts}` — copia exacta del patrón de `features/subcategorias/` (`EquiposDialog` recibe `{ sucursal: Sucursal | null, isAdmin, onOpenChange }`, se abre pasando una sucursal no-nula desde un botón "Equipos" por fila en `SucursalesTable`, exactamente como `SubcategoriasDialog`).
- `pages/SucursalesPage.tsx`: página admin-only con `TableCard`+`SucursalesTable`, estado local `equiposDe: Sucursal | null`, `<EquiposDialog sucursal={equiposDe} ... />` montado al final — mismo esqueleto que `CategoriasPage.tsx`.
- `features/caja/hooks/useEquiposDisponibles.ts`: `useQuery(['equipos-disponibles'], getEquiposDisponibles)`.

**Modificado:**
- `app/lazyPages.tsx` / `app/routes.tsx`: registrar `SucursalesPage` en `/sucursales`.
- `layouts/ProtectedLayout.tsx`: nuevo `NavItem` "Sucursales" en el grupo "Administración" (junto a Usuarios/Configuración), `adminOnly: true`.
- `features/usuarios/schemas/usuarioSchema.ts`: `sucursal_id: z.number().nullable()` + `.superRefine` que exige no-null al enviar — mismo idioma exacto que `compraSchema.ts` usa para `proveedor_id` (no un simple `.min(1)` de string, porque el valor real es numérico y `null` representa "sin seleccionar").
- `features/usuarios/components/UsuarioForm.tsx`: nuevo `SelectField` (componente ya existente en `components/form/SelectField.tsx`) para sucursal, poblado por `useSucursales('', 1, 100)` filtrado a `activo`, mismo patrón que `CompraForm.tsx` usa para su selector de proveedor (`parse={(v) => Number(v)}`).
- `services/usuarioService.ts`: `Usuario` y `UsuarioCreatePayload` agregan `sucursal_id`/`sucursal_nombre`.
- `features/usuarios/components/UsuariosTable.tsx`: nueva columna "Sucursal".
- `services/cajaService.ts`: `Caja` agrega `equipo_id: number`, `equipo_nombre: string`; `abrirCaja(equipo_id: number, monto_inicial: number)`.
- `features/caja/schemas/cajaSchema.ts`: `aperturaSchema` agrega `equipo_id: z.number()`.
- `features/caja/components/AbrirCajaSplash.tsx`: usa `useEquiposDisponibles()`. Si devuelve más de un equipo activo, muestra un `SelectField`/grupo de botones para elegir; si devuelve exactamente uno, se autoselecciona y se muestra como etiqueta fija de solo lectura (no tiene sentido pedir una decisión sin opciones reales).
- `features/caja/hooks/useCajaMutations.ts`: `useAbrirCaja` cambia su firma de mutación a `(equipo_id, monto_inicial)`.
- `pages/UsuariosPage.tsx`: el flujo de "Cerrar caja" de emergencia deja de usar `useCajaActual()`/`useCerrarCaja()` (que tras el rescoping quedan atados al usuario que llama — el admin, que nunca tiene caja propia, así que ya no sirven para este caso). Nuevos hooks (p. ej. `useCajaDeUsuario(usuarioId)`, `useCerrarCajaDeUsuario()`) contra `GET /usuarios/{id}/caja` y `POST /usuarios/{id}/caja/cerrar`.
- `pages/CajaPage.tsx`: eliminar la rama `if (!caja) { <AperturaCajaForm/> }` — queda **inalcanzable**: un cajero siempre tiene caja abierta al llegar a esta página (se lo exige `AbrirCajaSplash` antes de dejarlo pasar), y `role === 'admin'` ya se bloquea antes de este punto en el mismo archivo. Eliminar junto con el import de `useAbrirCaja` que solo alimentaba esa rama.
- `features/caja/components/AperturaCajaForm.tsx`: **eliminar el archivo completo** (sin otros importadores tras el punto anterior).
- `pages/DashboardPage.tsx`: la tarjeta "Estado de caja" usa hoy `useCajaActual()` sin distinguir rol. Para `cajero` sigue funcionando igual (ahora correctamente auto-escopeada a su propia caja). Para `admin`, reemplazar por un resumen agregado sobre `GET /reportes/cajas-abiertas` (p. ej. "3 cajas abiertas, $X esperado en total") — el enlace actual a "Abrir caja" no debe mostrarse para admin (esa ruta ya está bloqueada para su rol).
- `pages/ReportesPage.tsx`: la tarjeta "Resumen de caja" (singular) se reemplaza por una lista, una entrada por cada caja abierta, sobre el mismo endpoint nuevo.
- `services/reporteService.ts`: `getReporteCaja(): Promise<CajaResumen>` → `getCajasAbiertas(): Promise<CajaResumen[]>`.

## Verificación de Fase 1

1. `uv run python -c "from app.main import app"` tras cada bloque de cambios backend.
2. `npx tsc --noEmit` tras cada bloque de cambios frontend.
3. `alembic upgrade head` contra la base de desarrollo actual (con cajeros/cajas de prueba reales) — confirmar que el backfill deja todo consistente antes de que se agreguen los constraints NOT NULL/CHECK.
4. Prueba manual con los dos equipos físicos ya disponibles: crear una 2ª fila de `Equipo` desde el nuevo CRUD, loguear Pedro y Paula simultáneamente, cada uno abre en un equipo distinto — ambas cajas deben quedar abiertas sin error. Revisar Usuarios (ambos "Caja activa"), Dashboard/Reportes admin (lista con las 2), y el cierre de emergencia desde Usuarios contra una de ellas.

---

# Fase 2 — Stock por sucursal (implementar después de que Fase 1 esté funcionando y probada)

Completamente especificado para que se pueda ejecutar sin reabrir ninguna decisión.

## Por qué es una fase separada

Toca de forma pervasiva Inventario, Compras, Ventas (indirectamente), Reglas/Órdenes de reorden y Reportes — módulos que ya funcionan hoy con datos reales. Depende de que `Sucursal` exista (Fase 1). Hacerlo en el mismo cambio que Fase 1 sería una migración enorme, no revisable en partes, sobre un sistema que apenas va a tener su primera sucursal real — alto riesgo, cero forma de probarlo con una segunda ubicación real todavía. Secuenciarlo no es aplazarlo sin plan: queda 100% especificado aquí.

## Modelo nuevo

```python
# app/models/stock_sucursal.py
class StockSucursal(Base):
    __tablename__ = "stock_sucursal"
    __table_args__ = (CheckConstraint("cantidad >= 0", name="ck_stock_sucursal_no_negativo"),)
    producto_id: Mapped[int] = mapped_column(ForeignKey("productos.id"), primary_key=True)
    sucursal_id: Mapped[int] = mapped_column(ForeignKey("sucursales.id"), primary_key=True)
    cantidad: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
```
Clave primaria compuesta (no surrogate id) — es una tabla de hechos pura, un renglón por combinación producto×sucursal.

## `Producto.stock` se elimina

Migración: por cada `Producto`, insertar una fila en `stock_sucursal` con `sucursal_id` = la sucursal semilla de Fase 1 y `cantidad` = el valor actual de `Producto.stock` (backfill 1:1, ninguna cantidad se pierde). Luego `DROP COLUMN productos.stock` — no se mantiene como total denormalizado (evitar redundancia que se puede desincronizar; un total across-sucursales, si se necesita en el futuro, se calcula con `SUM(cantidad)` al vuelo, no se guarda).

## `app/services/inventario_service.py`

`registrar_movimiento` gana parámetro `sucursal_id`. El lock pasa de `producto_repository.get_by_id_for_update` (bloquea la fila de `Producto`) a un lock sobre la fila de `stock_sucursal` (`SELECT ... FOR UPDATE WHERE producto_id=... AND sucursal_id=...`) — el stock ya no vive en `Producto`. `MovimientoInventario` gana `sucursal_id` (FK), y `stock_resultante` pasa a ser el snapshot de `stock_sucursal.cantidad` para esa sucursal específica tras el movimiento (mismo concepto de hoy, ahora también partido por ubicación).

`reorden_service.disparar_si_corresponde` se llama con el `sucursal_id` de la salida que lo disparó — el umbral se compara contra el stock de ESA sucursal, no un total global.

## `app/models/regla_reorden.py` / `app/models/orden_reorden.py`

`ReglaReorden.producto_id` pierde el `unique=True` simple, se reemplaza por `UniqueConstraint("producto_id", "sucursal_id")` — una regla por producto **por sucursal** (cada tienda puede tener su propio umbral/cantidad de pedido para el mismo producto, según su rotación local). `OrdenReorden` gana `sucursal_id` (heredado de la regla que la disparó). El índice único parcial `ix_ordenes_reorden_una_pendiente_por_regla` (por `regla_reorden_id`) sigue funcionando igual sin cambios, porque `regla_reorden_id` ya identifica unívocamente producto+sucursal tras el cambio anterior.

## `app/models/compra.py`

`Compra` gana `sucursal_id` (FK, requerido) — una compra completa llega a una sola sucursal (igual que hoy una compra llega a un solo proveedor). `compra_service.crear` recibe `sucursal_id` explícito y lo usa al generar los movimientos de entrada en `inventario_service`.

## `app/services/venta_service.py`

Sin cambio de modelo — la venta ya sabe su `sucursal_id` transitivamente (`Venta.caja_id` → `CajaSesion.equipo_id` → `Equipo.sucursal_id`, o más simple, vía `usuario.sucursal_id` del cajero que vende, que es lo mismo dato). `inventario_service.registrar_movimiento` para la salida por venta recibe ese `sucursal_id` derivado.

## Frontend — selector de sucursal para admin

Cajero: nunca elige sucursal, todo se escopea automáticamente a `usuario.sucursal_id`. Admin: no pertenece a ninguna sucursal, así que las pantallas que muestran/mutan STOCK necesitan que elija con cuál está trabajando en este momento — Productos (columna stock), Inventario (movimientos + stock), Compras (a qué sucursal entra la mercancía), Reglas de reorden y Órdenes de reorden (umbral/disparo es por sucursal). Categorías/Subcategorías/Proveedores (catálogo puro, sin cantidad) **no** necesitan selector — siguen siendo globales.

Implementación sugerida: un selector de sucursal persistido (ej. Zustand store simple, `sucursalActivaStore`, similar a `authStore` pero solo para esto) visible en esas páginas para `admin`; para `cajero` el selector ni se muestra, el valor efectivo siempre es su propio `sucursal_id`.

## Verificación de Fase 2

1. Backfill de `stock_sucursal` verificado 1:1 contra los valores de `Producto.stock` antes de dropear la columna (comparar sumas antes/después).
2. Con 2 sucursales reales dadas de alta (ya existentes desde Fase 1 + una nueva), registrar una venta en cada una del mismo producto — confirmar que el stock de una no afecta a la otra.
3. Reglas de reorden: la misma regla (mismo producto) con umbrales distintos en 2 sucursales dispara órdenes independientes, cada una con su propio `sucursal_id`.
