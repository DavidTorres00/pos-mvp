import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  // % vs. un período de comparación (ej. el mismo rango de días, justo antes) — omitido o
  // `null` cuando no aplica (sin rango de fechas acotado que comparar, ver VentasPage)
  deltaPct?: number | null
}

export function StatCard({ label, value, deltaPct }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {deltaPct !== undefined && deltaPct !== null && (
        <p
          className={cn(
            'text-xs font-medium tabular-nums',
            deltaPct > 0 ? 'text-success' : deltaPct < 0 ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {deltaPct > 0 ? '▲' : deltaPct < 0 ? '▼' : '—'} {Math.abs(deltaPct).toFixed(1)}% vs período anterior
        </p>
      )}
    </div>
  )
}
