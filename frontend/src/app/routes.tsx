import { createBrowserRouter } from 'react-router-dom'

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import {
  AuditoriaPage,
  ConfiguracionPage,
  DashboardPage,
  InventarioPage,
  ProductosPage,
  ProveedoresPage,
  ReportesPage,
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
      { index: true, element: <DashboardPage /> },
      { path: 'productos', element: <ProductosPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'proveedores', element: <ProveedoresPage /> },
      { path: 'ventas', element: <VentasPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: 'auditoria', element: <AuditoriaPage /> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'sucursales', element: <SucursalesPage /> },
      { path: 'configuracion', element: <ConfiguracionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
