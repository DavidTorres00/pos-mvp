import { createBrowserRouter } from 'react-router-dom'

import { ProtectedLayout } from '@/layouts/ProtectedLayout'
import { CajaPage } from '@/pages/CajaPage'
import { CategoriasPage } from '@/pages/CategoriasPage'
import { ComprasPage } from '@/pages/ComprasPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { InventarioPage } from '@/pages/InventarioPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProductosPage } from '@/pages/ProductosPage'
import { ReportesPage } from '@/pages/ReportesPage'
import { VentasPage } from '@/pages/VentasPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'productos', element: <ProductosPage /> },
      { path: 'categorias', element: <CategoriasPage /> },
      { path: 'inventario', element: <InventarioPage /> },
      { path: 'caja', element: <CajaPage /> },
      { path: 'compras', element: <ComprasPage /> },
      { path: 'ventas', element: <VentasPage /> },
      { path: 'reportes', element: <ReportesPage /> },
    ],
  },
])
