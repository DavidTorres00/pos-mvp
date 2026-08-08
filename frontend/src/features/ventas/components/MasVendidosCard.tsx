import { EmptyState } from '@/components/DataStates'
import type { ProductoVenta } from '@/services/ventaService'

interface MasVendidosCardProps {
  items: ProductoVenta[]
}

export function MasVendidosCard({ items }: MasVendidosCardProps) {
  const max = Math.max(1, ...items.map((item) => item.cantidad))

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-muted-foreground">Más vendidos</h2>
      {items.length === 0 ? (
        <EmptyState message="No hay ventas en el período para armar este ranking." bordered={false} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.producto_id} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-sm" title={item.producto_nombre}>
                {item.producto_nombre}
              </span>
              <div className="h-2 flex-1 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.max(4, (item.cantidad / max) * 100)}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">{item.cantidad}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
