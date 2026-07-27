import { Suspense, useState } from 'react'
import {
  BarChart3Icon,
  BoxesIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PackageIcon,
  PiggyBankIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  StoreIcon,
  TagIcon,
  XIcon,
} from 'lucide-react'
import { Navigate, NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/DataStates'
import { cn } from '@/lib/utils'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { useAuthStore } from '@/stores/authStore'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', end: true, icon: LayoutDashboardIcon, adminOnly: false },
  { to: '/productos', label: 'Productos', icon: PackageIcon, adminOnly: false },
  { to: '/categorias', label: 'Categorías', icon: TagIcon, adminOnly: false },
  { to: '/inventario', label: 'Inventario', icon: BoxesIcon, adminOnly: false },
  { to: '/caja', label: 'Caja', icon: PiggyBankIcon, adminOnly: false },
  { to: '/compras', label: 'Compras', icon: ShoppingCartIcon, adminOnly: true },
  { to: '/ventas', label: 'Ventas', icon: ReceiptIcon, adminOnly: false },
  { to: '/reportes', label: 'Reportes', icon: BarChart3Icon, adminOnly: true },
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const isAdmin = usuario?.role === 'admin'
  const navLinks = NAV_LINKS.filter((link) => !link.adminOnly || isAdmin)

  return (
    <div className="flex min-h-svh">
      <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar sm:flex">
        <div className="flex items-center gap-2 px-4 py-4 font-heading text-sm font-semibold tracking-tight text-sidebar-foreground">
          <StoreIcon className="size-5 text-sidebar-primary" />
          MVP POS
        </div>

        <nav aria-label="Principal" className="flex flex-1 flex-col gap-0.5 px-2">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              <link.icon className="size-4 shrink-0" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          {usuario && <span className="truncate px-1 text-xs text-sidebar-foreground/60">{usuario.nombre}</span>}
          <Button variant="outline" size="sm" onClick={() => logout.mutate()} disabled={logout.isPending}>
            Cerrar sesión
          </Button>
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

          {mobileMenuOpen && (
            <nav
              aria-label="Principal (móvil)"
              className="flex animate-in flex-col gap-0.5 border-t px-2 py-2 fade-in-0 slide-in-from-top-2 duration-150"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
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
    </div>
  )
}
