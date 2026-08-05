import { Suspense, useEffect, useState } from 'react'
import {
  BarChart3Icon,
  BoxesIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PackageIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
  Building2Icon,
  ShoppingCartIcon,
  StoreIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { LoadingState } from '@/components/DataStates'
import { cn } from '@/lib/utils'
import { ProductosPage } from '@/app/lazyPages'
import { AbrirCajaSplash } from '@/features/caja/components/AbrirCajaSplash'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useMe } from '@/features/auth/hooks/useMe'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatTime } from '@/lib/format'
import { useAuthStore } from '@/stores/authStore'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboardIcon
  end?: boolean
}

interface NavGroup {
  label: string | null
  links: NavItem[]
}

// esta sidebar solo la renderiza el admin — el cajero corta camino antes (ver `if (esCajero)`
// más abajo) con su propio chrome, así que no hace falta filtrar por rol aquí
const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    links: [{ to: '/', label: 'Dashboard', end: true, icon: LayoutDashboardIcon }],
  },
  {
    label: 'Catálogo',
    links: [
      { to: '/productos', label: 'Productos', icon: PackageIcon },
      { to: '/categorias', label: 'Categorías', icon: TagIcon },
      { to: '/inventario', label: 'Inventario', icon: BoxesIcon },
    ],
  },
  {
    label: 'Operación',
    links: [{ to: '/ventas', label: 'Ventas', icon: ReceiptIcon }],
  },
  {
    label: 'Compras',
    links: [
      { to: '/compras', label: 'Compras', icon: ShoppingCartIcon },
      { to: '/proveedores', label: 'Proveedores', icon: TruckIcon },
      { to: '/reglas-reorden', label: 'Reglas de reorden', icon: RepeatIcon },
      { to: '/ordenes-reorden', label: 'Órdenes de reorden', icon: ClipboardCheckIcon },
    ],
  },
  {
    label: 'Administración',
    links: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3Icon },
      { to: '/auditoria', label: 'Auditoría', icon: ClipboardListIcon },
      { to: '/usuarios', label: 'Usuarios', icon: UsersIcon },
      { to: '/sucursales', label: 'Sucursales', icon: Building2Icon },
      { to: '/configuracion', label: 'Configuración', icon: SettingsIcon },
    ],
  },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-sidebar-primary/10 text-sidebar-primary'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
  const location = useLocation()
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [productosOpen, setProductosOpen] = useState(false)
  // contenedor real del <main> del cajero: los paneles/pantallas (Sheet) se portan aquí en vez
  // de document.body para que el appbar quede siempre visible y usable por encima — un
  // callback ref (no un ref object) porque necesitamos re-renderizar en cuanto el nodo exista
  const [mainEl, setMainEl] = useState<HTMLElement | null>(null)
  const esCajero = usuario?.role === 'cajero'
  const { data: cajaActual, isLoading: isLoadingCaja } = useCajaActual(esCajero)

  // sin este refetch periódico, cambios que un admin hace en vivo (otorgar permiso de retiro
  // de excedente, desactivar al usuario) nunca le llegaban a una sesión ya abierta — se quedaba
  // con el snapshot de `usuario` capturado en el login
  const { data: me } = useMe(isAuthenticated)
  useEffect(() => {
    if (me) setSession(me)
  }, [me, setSession])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // el cajero no ve nada de la app (sidebar, nav, otras páginas) hasta que exista una caja
  // abierta: sin caja no hay nada que hacer, y esto evita que se distraiga navegando antes
  // de contar/registrar su monto inicial
  if (esCajero && isLoadingCaja) {
    return <LoadingState />
  }
  if (esCajero && !cajaActual?.caja) {
    return (
      <AbrirCajaSplash
        nombre={usuario?.nombre ?? ''}
        limiteEfectivo={cajaActual?.limite_efectivo ?? null}
        ultimoCierre={cajaActual?.ultimo_cierre ?? null}
      />
    )
  }

  const logoutError = logout.isError ? getApiErrorMessage(logout.error, 'No se pudo cerrar sesión') : undefined

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
            <div className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight">
              <StoreIcon className="size-5" />
              MVP POS
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
          </div>
        </header>

        <main ref={setMainEl} className="relative flex flex-1 transform-gpu flex-col overflow-y-auto">
          <Suspense fallback={<LoadingState />}>
            <Outlet context={{ mainEl }} />
          </Suspense>
        </main>

        <Sheet open={productosOpen} onOpenChange={setProductosOpen}>
          <SheetContent side="right" container={mainEl} className="overflow-y-auto sm:max-w-2xl">
            <Suspense fallback={<LoadingState />}>
              <ProductosPage />
            </Suspense>
          </SheetContent>
        </Sheet>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sm:flex">
        <div className="flex items-center gap-2 px-4 py-4 font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
          <StoreIcon className="size-5 text-sidebar-primary" />
          MVP POS
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 px-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? 'root'} className="flex flex-col gap-0.5 py-1">
              {group.label && (
                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-sidebar-foreground/40 uppercase">
                  {group.label}
                </p>
              )}
              {group.links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
                  <link.icon className="size-4 shrink-0" />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          {usuario && <span className="truncate px-1 text-xs text-sidebar-foreground/60">{usuario.nombre}</span>}
          <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Cerrar sesión
          </Button>
          {logoutError && <p className="px-1 text-xs text-destructive">{logoutError}</p>}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 sm:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-2 font-heading text-sm font-semibold tracking-tight text-foreground">
              <StoreIcon className="size-5 text-primary" />
              MVP POS
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
                Cerrar sesión
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? <XIcon /> : <MenuIcon />}
              </Button>
            </div>
          </div>

          {logoutError && <p className="px-4 pb-2 text-xs text-destructive">{logoutError}</p>}

          {mobileMenuOpen && (
            <nav
              aria-label="Principal (móvil)"
              className="flex animate-in flex-col gap-0.5 border-t px-2 py-2 fade-in-0 slide-in-from-top-2 duration-150"
            >
              {NAV_GROUPS.map((group) => (
                <div key={group.label ?? 'root'} className="flex flex-col gap-0.5 py-1">
                  {group.label && (
                    <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/70 uppercase">
                      {group.label}
                    </p>
                  )}
                  {group.links.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon className="size-4 shrink-0" />
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          )}
        </header>

        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </div>
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
