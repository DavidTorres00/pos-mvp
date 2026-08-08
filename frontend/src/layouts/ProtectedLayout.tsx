import { Suspense, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  BoxesIcon,
  ChevronDownIcon,
  ClipboardListIcon,
  Maximize2Icon,
  MenuIcon,
  Minimize2Icon,
  PackageIcon,
  ReceiptIcon,
  SettingsIcon,
  Building2Icon,
  TruckIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { LoadingState } from '@/components/DataStates'
import { ServidorMantenimiento } from '@/components/ServidorMantenimiento'
import { ServidorRestablecido } from '@/components/ServidorRestablecido'
import { useSaludServidor } from '@/lib/hooks/useSaludServidor'
import { cn } from '@/lib/utils'
import { AbrirCajaSplash } from '@/features/caja/components/AbrirCajaSplash'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useCajaEventos } from '@/features/caja/hooks/useCajaEventos'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useMe } from '@/features/auth/hooks/useMe'
import { ProductoPickerPanel } from '@/features/ventas/components/ProductoPickerPanel'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatTime } from '@/lib/format'
import type { ProductoConStock } from '@/services/productoService'
import { useAuthStore } from '@/stores/authStore'
import { useServidorStore } from '@/stores/servidorStore'

interface NavItem {
  to: string
  label: string
  icon: typeof ReceiptIcon
  end?: boolean
}

// tab suelto (Ventas, Proveedores, Sucursales, Auditoría) vs. tab con submenú desplegable
// (agrupa módulos afines) — el topbar del admin reemplaza a la sidebar clásica (ver
// `if (esCajero)` más abajo para el chrome del cajero, que es un topbar distinto y no pasa por
// esta lista). Sin Dashboard/"Panel": Ventas es la pantalla de entrada (ver routes.tsx).
type TopbarGroup = ({ type: 'link' } & NavItem) | { type: 'menu'; label: string; links: NavItem[] }

const TOPBAR_GROUPS: TopbarGroup[] = [
  { type: 'link', to: '/ventas', label: 'Ventas', end: true, icon: ReceiptIcon },
  {
    type: 'menu',
    label: 'Catálogo',
    links: [
      { to: '/productos', label: 'Productos', icon: PackageIcon },
      { to: '/inventario', label: 'Inventario', icon: BoxesIcon },
    ],
  },
  { type: 'link', to: '/proveedores', label: 'Proveedores', icon: TruckIcon },
  { type: 'link', to: '/sucursales', label: 'Sucursales', icon: Building2Icon },
  { type: 'link', to: '/auditoria', label: 'Auditoría', icon: ClipboardListIcon },
  {
    type: 'menu',
    label: 'Ajustes',
    links: [
      { to: '/usuarios', label: 'Usuarios', icon: UsersIcon },
      { to: '/configuracion', label: 'Configuración', icon: SettingsIcon },
    ],
  },
]

function grupoActivo(group: TopbarGroup, pathname: string): boolean {
  if (group.type === 'link') {
    return group.end ? pathname === group.to : pathname.startsWith(group.to)
  }
  return group.links.some((link) => pathname.startsWith(link.to))
}

const topbarTabClass = (active: boolean) =>
  cn(
    'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors outline-none',
    active
      ? 'bg-sidebar-primary/10 text-sidebar-primary'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  )

const dropdownNavItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none',
    isActive ? 'bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground',
  )

const cajeroNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary-foreground/15 text-primary-foreground'
      : 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground',
  )

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const usuario = useAuthStore((state) => state.usuario)
  const setSession = useAuthStore((state) => state.setSession)
  const servidorCaido = useServidorStore((state) => state.caido)
  useSaludServidor(isAuthenticated)
  const queryClient = useQueryClient()
  // pantalla de recuperación transitoria (ver ServidorRestablecido) — se activa una vez, al
  // detectar la transición true→false, y se cierra sola o con el clic de "Continuar ahora"
  const [servidorRestablecido, setServidorRestablecido] = useState(false)
  const servidorCaidoPrevRef = useRef(false)
  useEffect(() => {
    if (!servidorCaido && servidorCaidoPrevRef.current) {
      setServidorRestablecido(true)
      // el heartbeat solo prueba que /api/health responde, no que `caja-actual` ya está al día
      // (pudo quedar con datos de hace varios segundos mientras el servidor estuvo caído) —
      // sin este refetch proactivo, el cajero podía ver un flash de `AbrirCajaSplash` en cuanto
      // se cierra esta pantalla, antes de que el próximo poll de 15s trajera la caja real.
      queryClient.refetchQueries({ queryKey: ['caja-actual'] })
    }
    servidorCaidoPrevRef.current = servidorCaido
  }, [servidorCaido, queryClient])
  const location = useLocation()
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [productosOpen, setProductosOpen] = useState(false)
  // contenedor real del <main> del cajero: los paneles/pantallas (Sheet) se portan aquí en vez
  // de document.body para que el appbar quede siempre visible y usable por encima (Sheet los
  // posiciona `absolute` contra este `relative`, ver components/ui/sheet.tsx) — un callback ref
  // (no un ref object) porque necesitamos re-renderizar en cuanto el nodo exista
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null)
  // el picker de Productos vive aquí (fuera del <Outlet>, junto a su botón en el header), pero
  // "agregar a la venta" es lógica de VentaKiosco — esta ref la deja registrar su propia función
  // sin tener que levantar el estado de la venta hasta este layout
  const agregarProductoRef = useRef<(producto: ProductoConStock) => void>(() => {})
  // tras "Terminar turno", VentaKiosco muestra el resultado del cierre (cuadró o no) y espera a
  // que el cajero confirme "Salir" antes de desloguear — mientras tanto la caja ya está cerrada
  // en el servidor, así que `cajaActual.caja` puede llegar a null (por invalidación o por el
  // polling de abajo) antes de ese clic. Sin esta ref, este layout lo tomaría como "sin caja
  // abierta" y reemplazaría a VentaKiosco por `AbrirCajaSplash` a medio leer el resumen.
  const terminandoTurnoRef = useRef(false)
  const [pantallaCompleta, setPantallaCompleta] = useState(() => document.fullscreenElement !== null)
  const esCajero = usuario?.role === 'cajero'
  const esSuperuser = usuario?.role === 'superuser'
  const { data: cajaActual, isLoading: isLoadingCaja } = useCajaActual(esCajero)
  useCajaEventos(esCajero)

  // sincroniza el ícono con salidas de pantalla completa que no pasan por el botón (Esc, F11)
  useEffect(() => {
    function onFullscreenChange() {
      setPantallaCompleta(document.fullscreenElement !== null)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  // sin este refetch periódico, cambios que un admin hace en vivo sobre un cajero (otorgar
  // permiso de retiro de excedente, desactivar al usuario) nunca le llegaban a una sesión de
  // cajero ya abierta — se quedaba con el snapshot de `usuario` capturado en el login. Scopeado
  // a `esCajero`: ningún admin puede editar a otro admin desde la UI (no hay segundo flujo de
  // alta, ver docs/BACKEND.md), así que pollear /auth/me cada 30s en una sesión admin no tiene
  // ningún cambio real que detectar — puro consumo de red sin beneficio.
  const { data: me } = useMe(isAuthenticated && esCajero)
  useEffect(() => {
    if (me) setSession(me)
  }, [me, setSession])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // gatea TODO (cajero y admin) antes de montar cualquier topbar/página — mientras el servidor
  // no responde no tiene sentido dejar que cada query/mutation falle por su lado (toasts +
  // ErrorState dispersos, ver services/api.ts). Va antes de los checks de `esCajero` de abajo:
  // con el servidor caído no hay forma confiable de saber si hay caja abierta o no.
  if (servidorCaido) {
    return <ServidorMantenimiento />
  }
  if (servidorRestablecido) {
    return <ServidorRestablecido onContinuar={() => setServidorRestablecido(false)} />
  }

  // el cajero no ve nada de la app (sidebar, nav, otras páginas) hasta que exista una caja
  // abierta: sin caja no hay nada que hacer, y esto evita que se distraiga navegando antes
  // de contar/registrar su monto inicial
  if (esCajero && isLoadingCaja) {
    return <LoadingState />
  }
  if (esCajero && !cajaActual?.caja && !terminandoTurnoRef.current) {
    return (
      <AbrirCajaSplash
        nombre={usuario?.nombre ?? ''}
        limiteEfectivo={cajaActual?.limite_efectivo ?? null}
        ultimoCierre={cajaActual?.ultimo_cierre ?? null}
      />
    )
  }

  const logoutError = logout.isError ? getApiErrorMessage(logout.error, 'No se pudo cerrar sesión') : undefined

  // el superuser (dueño de Soluciones Web) no es un rol de negocio del cliente: sin sidebar, sin
  // topbar de módulos, una sola pantalla — gestiona el cupo de equipos de esta instalación y
  // nada más (ver docs/BACKEND.md). Lock total a /plan: cualquier otra ruta redirige ahí, no
  // tiene sentido que este rol navegue a Ventas/Productos/etc.
  if (esSuperuser) {
    if (location.pathname !== '/plan') {
      return <Navigate to="/plan" replace />
    }
    return (
      <div className="flex min-h-svh flex-col">
        <header className="flex h-14 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground shadow-sm sm:px-6">
          <div className="flex items-center gap-2.5 font-heading text-base font-semibold tracking-tight">
            <img src="/logo-ce-fondo-claro.svg" alt="" aria-hidden className="size-8" />
            Cē POS
            <span className="ml-1 rounded-full bg-sidebar-primary/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-sidebar-primary uppercase">
              Superuser
            </span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {usuario && (
              <span className="hidden truncate text-xs text-sidebar-foreground/60 lg:inline">{usuario.nombre}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Cerrar sesión
            </Button>
          </div>
        </header>

        {logoutError && <p className="px-4 pt-2 text-xs text-destructive sm:px-6">{logoutError}</p>}

        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </div>
    )
  }

  // con caja abierta, el cajero pasa a un chrome propio (topbar, sin sidebar): no hay
  // Dashboard para este rol, así que la ruta índice cae directo en Ventas
  if (esCajero) {
    if (location.pathname === '/') {
      return <Navigate to="/ventas" replace />
    }
    return (
      <div className="flex h-svh flex-col overflow-hidden">
        <header className="flex shrink-0 flex-col gap-3 bg-primary px-4 py-3 text-primary-foreground shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 font-heading text-base font-semibold tracking-tight">
              <img src="/logo-ce-fondo-oscuro.svg" alt="" aria-hidden className="size-8" />
              Cē POS
            </div>
            <nav aria-label="Principal" className="flex items-center gap-1">
              <NavLink to="/ventas" end className={cajeroNavLinkClass}>
                <ReceiptIcon className="size-4 shrink-0" />
                Ventas
              </NavLink>
              <button
                type="button"
                onClick={() => setProductosOpen(true)}
                className={cajeroNavLinkClass({ isActive: productosOpen })}
              >
                <PackageIcon className="size-4 shrink-0" />
                Productos
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {cajaActual?.caja && (
              <span className="hidden text-primary-foreground/50 lg:inline">
                {cajaActual.caja.sucursal_nombre} · {cajaActual.caja.equipo_nombre}
              </span>
            )}

            <span aria-hidden className="hidden h-4 w-px bg-primary-foreground/20 lg:block" />

            <span className="hidden items-center gap-1.5 rounded-full bg-primary-foreground/10 px-2.5 py-1 sm:flex">
              <span
                className={cn('size-1.5 rounded-full', cajaActual?.excede_limite ? 'bg-destructive' : 'bg-success')}
              />
              <span className="font-medium tracking-wide text-primary-foreground/80 uppercase">
                {cajaActual?.excede_limite ? 'Límite superado' : 'Disponible para cobrar'}
              </span>
            </span>

            {usuario && (
              <>
                <span aria-hidden className="hidden h-4 w-px bg-primary-foreground/20 sm:block" />
                <span className="hidden sm:inline">
                  <span className="font-semibold">{usuario.nombre}</span>
                  <span className="ml-1.5 text-[10px] tracking-wide text-primary-foreground/50 uppercase">Cajero</span>
                </span>
              </>
            )}

            <span aria-hidden className="h-4 w-px bg-primary-foreground/20" />
            <TopbarClock />

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
              title={pantallaCompleta ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground"
              onClick={toggleFullscreen}
            >
              {pantallaCompleta ? <Minimize2Icon /> : <Maximize2Icon />}
            </Button>
          </div>
        </header>

        {/* `main` ya no scrollea directo: es solo el contenedor `relative` (destino del portal
            del Sheet, que se posiciona `absolute` contra él, ver comentario de `mainEl`
            arriba). El scroll real vive en el div de adentro, separado del nodo donde se monta
            el Sheet. */}
        <main ref={setMainEl} className="relative flex-1 overflow-hidden">
          <div className="flex h-full flex-col overflow-y-auto">
            <Suspense fallback={<LoadingState />}>
              <Outlet context={{ mainEl, agregarProductoRef, terminandoTurnoRef }} />
            </Suspense>
          </div>
        </main>

        <Sheet open={productosOpen} onOpenChange={setProductosOpen}>
          <SheetContent side="right" container={mainEl} showCloseButton={false} className="overflow-y-auto sm:max-w-2xl">
            <ProductoPickerPanel
              onAgregar={(producto) => agregarProductoRef.current(producto)}
              onClose={() => setProductosOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
          <div className="flex items-center gap-2.5 font-heading text-base font-semibold tracking-tight">
            <img src="/logo-ce-fondo-claro.svg" alt="" aria-hidden className="size-8" />
            Cē POS
          </div>

          <nav aria-label="Principal" className="ml-4 hidden items-center gap-1 sm:flex">
            {TOPBAR_GROUPS.map((group) => {
              const active = grupoActivo(group, location.pathname)
              if (group.type === 'link') {
                return (
                  <NavLink key={group.to} to={group.to} end={group.end} className={topbarTabClass(active)}>
                    <group.icon className="size-4 shrink-0" />
                    {group.label}
                  </NavLink>
                )
              }
              return (
                <DropdownMenu key={group.label}>
                  <DropdownMenuTrigger className={topbarTabClass(active)}>
                    {group.label}
                    <ChevronDownIcon className="size-3.5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {group.links.map((link) => (
                      <DropdownMenuItem key={link.to} asChild>
                        <NavLink to={link.to} className={dropdownNavItemClass}>
                          <link.icon className="size-4 shrink-0" />
                          {link.label}
                        </NavLink>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {usuario && <span className="hidden truncate text-xs text-sidebar-foreground/60 lg:inline">{usuario.nombre}</span>}
            <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Cerrar sesión
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
            </Button>
          </div>
        </div>

        {logoutError && <p className="px-4 pb-2 text-xs text-destructive sm:px-6">{logoutError}</p>}

        {mobileMenuOpen && (
          <nav
            aria-label="Principal (móvil)"
            className="flex animate-in flex-col gap-0.5 border-t border-sidebar-border px-2 py-2 fade-in-0 slide-in-from-top-2 duration-150 sm:hidden"
          >
            {TOPBAR_GROUPS.flatMap((group) => (group.type === 'link' ? [group] : group.links)).map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary/10 text-sidebar-primary'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )
                }
                onClick={() => setMobileMenuOpen(false)}
              >
                <link.icon className="size-4 shrink-0" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <Suspense fallback={<LoadingState />}>
        <Outlet />
      </Suspense>
    </div>
  )
}

function TopbarClock() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return <span className="text-sm font-semibold tabular-nums">{formatTime(ahora)}</span>
}
