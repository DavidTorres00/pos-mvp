import { AtencionFeed } from '@/features/ventas/components/AtencionFeed'
import { formatCurrency } from '@/lib/format'
import type { Alerta } from '@/services/reporteService'

interface RequierenDecisionCardProps {
  alertas: Alerta[]
  onAcusar: (alerta: Alerta) => void
  acusandoAuditoriaId: number | null
  devolucionesMonto: string
  devolucionesCantidad: number
  cancelacionesMonto: string
  cancelacionesCantidad: number
}

// "Atención" del hub de Ventas: devoluciones/cancelaciones del período (mutuamente excluyentes,
// ver docs/BACKEND.md) arriba, alertas operativas de sucursal/caja/stock abajo — vía
// AtencionFeed (`GET /reportes/atencion`), filtrado a la sucursal seleccionada.
export function RequierenDecisionCard({
  alertas,
  onAcusar,
  acusandoAuditoriaId,
  devolucionesMonto,
  devolucionesCantidad,
  cancelacionesMonto,
  cancelacionesCantidad,
}: RequierenDecisionCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-muted-foreground">Atención</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Devoluciones ({devolucionesCantidad})
          </p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(devolucionesMonto)}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            Cancelaciones ({cancelacionesCantidad})
          </p>
          <p className="text-lg font-semibold tabular-nums">{formatCurrency(cancelacionesMonto)}</p>
        </div>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <AtencionFeed alertas={alertas} onAcusar={onAcusar} acusandoAuditoriaId={acusandoAuditoriaId} />
      </div>
    </div>
  )
}
