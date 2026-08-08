import { lazy } from 'react'

export const AuditoriaPage = lazy(() => import('@/pages/AuditoriaPage').then((m) => ({ default: m.AuditoriaPage })))
export const UsuariosPage = lazy(() => import('@/pages/UsuariosPage').then((m) => ({ default: m.UsuariosPage })))
export const ProveedoresPage = lazy(() =>
  import('@/pages/ProveedoresPage').then((m) => ({ default: m.ProveedoresPage })),
)
export const ConfiguracionPage = lazy(() =>
  import('@/pages/ConfiguracionPage').then((m) => ({ default: m.ConfiguracionPage })),
)
export const ProductosPage = lazy(() => import('@/pages/ProductosPage').then((m) => ({ default: m.ProductosPage })))
export const InventarioPage = lazy(() =>
  import('@/pages/InventarioPage').then((m) => ({ default: m.InventarioPage })),
)
export const VentasPage = lazy(() => import('@/pages/VentasPage').then((m) => ({ default: m.VentasPage })))
export const SucursalesPage = lazy(() =>
  import('@/pages/SucursalesPage').then((m) => ({ default: m.SucursalesPage })),
)
export const PlanPage = lazy(() => import('@/pages/PlanPage').then((m) => ({ default: m.PlanPage })))
