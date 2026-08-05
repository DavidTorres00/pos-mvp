import { Suspense, useState } from 'react'
import {
  BarChart3Icon,
  BoxesIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PackageIcon,
  PiggyBankIcon,
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
import { Navigate, NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/DataStates'
import { cn } from '@/lib/utils'
import { AbrirCajaSplash } from '@/features/caja/components/AbrirCajaSplash'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { getApiErrorMessage } from '@/lib/apiError'
import { useAuthStore } from '@/stores/authStore'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboardIcon
  adminOnly: boolean
  cajeroOnly?: boolean
  end?: boolean
}

interface NavGroup {
  label: string | null
  links: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    links: [{ to: '/', label: 'Dashboard', end: true, icon: LayoutDashboardIcon, adminOnly: false }],
  },
  {
    label: 'Catálogo',
    links: [
      { to: '/productos', label: 'Productos', icon: PackageIcon, adminOnly: false },
      { to: '/categorias', label: 'Categorías', icon: TagIcon, adminOnly: true },
      { to: '/inventario', label: 'Inventario', icon: BoxesIcon, adminOnly: true },
    ],
  },
  {
    label: 'Operación',
    links: [
      { to: '/caja', label: 'Caja', icon: PiggyBankIcon, adminOnly: false, cajeroOnly: true },
      { to: '/ventas', label: 'Ventas', icon: ReceiptIcon, adminOnly: false },
    ],
  },
  {
    label: 'Compras',
    links: [
      { to: '/compras', label: 'Compras', icon: ShoppingCartIcon, adminOnly: true },
      { to: '/proveedores', label: 'Proveedores', icon: TruckIcon, adminOnly: true },
      { to: '/reglas-reorden', label: 'Reglas de reorden', icon: RepeatIcon, adminOnly: true },
      { to: '/ordenes-reorden', label: 'Órdenes de reorden', icon: ClipboardCheckIcon, adminOnly: true },
    ],
  },
  {
    label: 'Administración',
    links: [
      { to: '/reportes', label: 'Reportes', icon: BarChart3Icon, adminOnly: true },
      { to: '/auditoria', label: 'Auditoría', icon: ClipboardListIcon, adminOnly: true },
      { to: '/usuarios', label: 'Usuarios', icon: UsersIcon, adminOnly: true },
      { to: '/sucursales', label: 'Sucursales', icon: Building2Icon, adminOnly: true },
      { to: '/configuracion', label: 'Configuración', icon: SettingsIcon, adminOnly: true },
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

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const usuario = useAuthStore((state) => state.usuario)
  const logout = useLogout()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const esCajero = usuario?.role === 'cajero'
  const { data: cajaActual, isLoading: isLoadingCaja } = useCajaActual(esCajero)

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

  const isAdmin = usuario?.role === 'admin'
  const navGroups = NAV_GROUPS.map((group) => ({
    ...group,
    links: group.links.filter((link) => (!link.adminOnly || isAdmin) && (!link.cajeroOnly || !isAdmin)),
  })).filter((group) => group.links.length > 0)

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sm:flex">
        <div className="flex items-center gap-2 px-4 py-4 font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
          <StoreIcon className="size-5 text-sidebar-primary" />
          MVP POS
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 px-2">
          {navGroups.map((group) => (
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
              {navGroups.map((group) => (
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
