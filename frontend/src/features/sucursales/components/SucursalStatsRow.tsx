import { formatCurrency } from '@/lib/format'

interface SucursalStatsRowProps {
  cajasConfiguradas: number
  cajasAbiertas: number
  efectivoEnCajas: number
  ventasHoy: number
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
    </div>
  )
}

export function SucursalStatsRow({ cajasConfiguradas, cajasAbiertas, efectivoEnCajas, ventasHoy }: SucursalStatsRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Cajas configuradas" value={String(cajasConfiguradas)} />
      <Stat label="Abiertas ahora" value={String(cajasAbiertas)} />
      <Stat label="Efectivo en cajas" value={formatCurrency(efectivoEnCajas)} />
      <Stat label="Ventas de hoy" value={formatCurrency(ventasHoy)} />
    </div>
  )
}
