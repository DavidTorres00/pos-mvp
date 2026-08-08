import { EmptyState } from '@/components/DataStates'
import { formatCurrency } from '@/lib/format'
import type { VentaPorSucursal } from '@/services/ventaService'

interface SucursalRankingCardProps {
  items: VentaPorSucursal[]
}

// solo visible con "Todas las sucursales" seleccionada (ver VentasPage) — con una sola sucursal
// elegida no hay nada que rankear, es la misma vista dos veces
export function SucursalRankingCard({ items }: SucursalRankingCardProps) {
  const max = Math.max(1, ...items.map((item) => Number(item.total_monto)))

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-muted-foreground">Sucursales</h2>
      {items.length === 0 ? (
        <EmptyState message="No hay ventas en el período para armar este ranking." bordered={false} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.sucursal_id} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-sm" title={item.sucursal_nombre}>
                {item.sucursal_nombre}
              </span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (Number(item.total_monto) / max) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums">
                {formatCurrency(item.total_monto)}
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {formatCurrency(item.utilidad_total)} util.
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
