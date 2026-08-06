import { formatCurrency } from '@/lib/format'
import type { SucursalResumen } from '@/services/reporteService'

interface SucursalCardProps {
  resumen: SucursalResumen
}

export function SucursalCard({ resumen }: SucursalCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
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
      {resumen.cajas_excedidas > 0 ? (
        <p className="rounded-md bg-destructive/10 px-2 py-1 text-center text-xs font-medium text-destructive">
          {resumen.cajas_excedidas} {resumen.cajas_excedidas === 1 ? 'caja excedida' : 'cajas excedidas'}
        </p>
      ) : (
        <p className="rounded-md bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">
          Sin alertas
        </p>
      )}
    </div>
  )
}
