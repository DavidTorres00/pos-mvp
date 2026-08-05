import { lazy } from 'react'

export const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
export const AuditoriaPage = lazy(() => import('@/pages/AuditoriaPage').then((m) => ({ default: m.AuditoriaPage })))
export const UsuariosPage = lazy(() => import('@/pages/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
export const ReglasReordenPage = lazy(() =>
  import('@/pages/ReglasReordenPage').then((m) => ({ default: m.ReglasReordenPage })),
)
export const OrdenesReordenPage = lazy(() =>
  import('@/pages/OrdenesReordenPage').then((m) => ({ default: m.OrdenesReordenPage })),
)
export const ProveedoresPage = lazy(() =>
  import('@/pages/ProveedoresPage').then((m) => ({ default: m.ProveedoresPage })),
)
export const ConfiguracionPage = lazy(() =>
  import('@/pages/ConfiguracionPage').then((m) => ({ default: m.ConfiguracionPage })),
)
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
export const SucursalesPage = lazy(() =>
  import('@/pages/SucursalesPage').then((m) => ({ default: m.SucursalesPage })),
)
