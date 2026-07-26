import { Navigate, NavLink, Outlet } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-semibold text-foreground' : 'text-muted-foreground'

export function ProtectedLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())
  const clearSession = useAuthStore((state) => state.clearSession)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-svh flex-col">
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex gap-4">
          <NavLink to="/" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/productos" className={navLinkClass}>
            Productos
          </NavLink>
          <NavLink to="/categorias" className={navLinkClass}>
            Categorías
          </NavLink>
          <NavLink to="/inventario" className={navLinkClass}>
            Inventario
          </NavLink>
          <NavLink to="/caja" className={navLinkClass}>
            Caja
          </NavLink>
          <NavLink to="/compras" className={navLinkClass}>
            Compras
          </NavLink>
          <NavLink to="/ventas" className={navLinkClass}>
            Ventas
          </NavLink>
          <NavLink to="/reportes" className={navLinkClass}>
            Reportes
          </NavLink>
        </div>
        <Button variant="outline" size="sm" onClick={clearSession}>
          Cerrar sesión
        </Button>
      </nav>
      <Outlet />
    </div>
  )
}
