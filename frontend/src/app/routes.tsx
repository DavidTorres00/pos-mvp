import { createBrowserRouter } from 'react-router-dom'

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import {
  CajaPage,
  CategoriasPage,
  ComprasPage,
  DashboardPage,
  InventarioPage,
  ProductosPage,
  ReportesPage,
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
      { path: 'categorias', element: <CategoriasPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'caja', element: <CajaPage /> },
      { path: 'compras', element: <ComprasPage /> },
      { path: 'ventas', element: <VentasPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
