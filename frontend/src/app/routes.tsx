import { Navigate, createBrowserRouter } from 'react-router-dom'

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import {
  AuditoriaPage,
  ConfiguracionPage,
  InventarioPage,
  PlanPage,
  ProductosPage,
  ProveedoresPage,
  SucursalesPage,
  UsuariosPage,
  VentasPage,
} from '@/app/lazyPages'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorBoundary /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // sin Dashboard: Ventas es la pantalla de entrada del admin, ya trae KPIs/Atención/Top
      // productos — ver docs/FRONTEND.md
      { index: true, element: <Navigate to="/ventas" replace /> },
      { path: 'productos', element: <ProductosPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'proveedores', element: <ProveedoresPage /> },
      { path: 'ventas', element: <VentasPage /> },
      { path: 'auditoria', element: <AuditoriaPage /> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'sucursales', element: <SucursalesPage /> },
      { path: 'configuracion', element: <ConfiguracionPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
