import { StatCard } from '@/components/StatCard'
import { formatCurrency } from '@/lib/format'

interface SucursalStatsRowProps {
  cajasConfiguradas: number
  cajasAbiertas: number
  efectivoEnCajas: number
  ventasHoy: number
}

export function SucursalStatsRow({ cajasConfiguradas, cajasAbiertas, efectivoEnCajas, ventasHoy }: SucursalStatsRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Cajas configuradas" value={String(cajasConfiguradas)} />
      <StatCard label="Abiertas ahora" value={String(cajasAbiertas)} />
      <StatCard label="Efectivo en cajas" value={formatCurrency(efectivoEnCajas)} />
      <StatCard label="Ventas de hoy" value={formatCurrency(ventasHoy)} />
    </div>
  )
}
