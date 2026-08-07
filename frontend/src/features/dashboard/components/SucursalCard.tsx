import { AlertTriangleIcon } from 'lucide-react'

import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Alerta, SucursalResumen } from '@/services/reporteService'

interface SucursalCardProps {
  resumen: SucursalResumen
  // alertas de `GET /reportes/atencion` ya filtradas a `sucursal_id === resumen.sucursal_id` por
  // el caller — la card no vuelve a comparar cajas_excedidas por su cuenta (ver docs/FRONTEND.md,
  // antes esta card y AtencionFeed podían contradecirse: la card medía solo cajas_excedidas y el
  // feed medía las 6 fuentes de alerta reales)
  alertas: Alerta[]
}

export function SucursalCard({ resumen, alertas }: SucursalCardProps) {
  const tieneAlertas = alertas.length > 0

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm',
        tieneAlertas && 'border-destructive/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold">{resumen.sucursal_nombre}</p>
        <p className="text-right text-xs text-muted-foreground">
          {resumen.cajas_abiertas} de {resumen.equipos_activos}
          <br />
          {resumen.equipos_activos === 1 ? 'caja abierta' : 'cajas abiertas'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Ventas</p>
          <p className="font-semibold tabular-nums">{formatCurrency(resumen.ventas_hoy)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Efectivo</p>
          <p className="font-semibold tabular-nums">{formatCurrency(resumen.efectivo_esperado)}</p>
        </div>
      </div>
      {tieneAlertas ? (
        <p className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1 text-center text-xs font-medium text-destructive">
          <AlertTriangleIcon className="size-3.5 shrink-0" />
          {alertas.length === 1 ? alertas[0].titulo : `${alertas.length} alertas`}
        </p>
      ) : (
        <p className="rounded-md bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">
          Sin alertas
        </p>
      )}
    </div>
  )
}
