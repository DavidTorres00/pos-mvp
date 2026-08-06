import { createBrowserRouter } from 'react-router-dom'

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import {
  AuditoriaPage,
  ComprasPage,
  ConfiguracionPage,
  DashboardPage,
  InventarioPage,
  OrdenesReordenPage,
  ProductosPage,
  ProveedoresPage,
  ReglasReordenPage,
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
      { path: 'compras', element: <ComprasPage /> },
      { path: 'proveedores', element: <ProveedoresPage /> },
      { path: 'reglas-reorden', element: <ReglasReordenPage /> },
      { path: 'ordenes-reorden', element: <OrdenesReordenPage /> },
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
