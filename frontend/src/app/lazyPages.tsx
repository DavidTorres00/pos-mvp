import { lazy } from 'react'

export const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
export const ProductosPage = lazy(() => import('@/pages/ProductosPage').then((m) => ({ default: m.ProductosPage })))
export const CategoriasPage = lazy(() =>
  import('@/pages/CategoriasPage').then((m) => ({ default: m.CategoriasPage })),
)
export const InventarioPage = lazy(() =>
  import('@/pages/InventarioPage').then((m) => ({ default: m.InventarioPage })),
)
export const CajaPage = lazy(() => import('@/pages/CajaPage').then((m) => ({ default: m.CajaPage })))
export const ComprasPage = lazy(() => import('@/pages/ComprasPage').then((m) => ({ default: m.ComprasPage })))
export const VentasPage = lazy(() => import('@/pages/VentasPage').then((m) => ({ default: m.VentasPage })))
export const ReportesPage = lazy(() => import('@/pages/ReportesPage').then((m) => ({ default: m.ReportesPage })))
