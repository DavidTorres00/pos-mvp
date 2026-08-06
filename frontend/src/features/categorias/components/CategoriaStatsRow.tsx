import { StatCard } from '@/components/StatCard'

interface CategoriaStatsRowProps {
  totalSubcategorias: number
  totalProductos: number
}

export function CategoriaStatsRow({ totalSubcategorias, totalProductos }: CategoriaStatsRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard label="Subcategorías" value={String(totalSubcategorias)} />
      <StatCard label="Productos activos" value={String(totalProductos)} />
    </div>
  )
}
