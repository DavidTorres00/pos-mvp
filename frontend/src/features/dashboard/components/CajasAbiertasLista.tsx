import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CajaResumen } from '@/services/cajaService'

interface CajasAbiertasListaProps {
  resumenes: CajaResumen[]
}

export function CajasAbiertasLista({ resumenes }: CajasAbiertasListaProps) {
  if (resumenes.length === 0) {
    return <EmptyState message="No hay ninguna caja abierta ahora mismo." bordered={false} />
  }

  return (
    <div className="flex flex-col divide-y">
      {resumenes.map((resumen) => {
        const esperado = Number(resumen.monto_esperado)
        const limite = resumen.limite_efectivo !== null ? Number(resumen.limite_efectivo) : null
        const excede = limite !== null && esperado > limite
        const porcentaje = limite ? Math.min(100, (esperado / limite) * 100) : 0
        return (
          <div key={resumen.caja.id} className="flex flex-col gap-1.5 py-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="truncate font-medium">
                {resumen.caja.usuario_nombre}{' '}
                <span className="font-normal text-muted-foreground">
                  · {resumen.caja.sucursal_nombre} · {resumen.caja.equipo_nombre}
                </span>
              </p>
              <p className={cn('shrink-0 font-semibold tabular-nums', excede && 'text-destructive')}>
                {formatCurrency(esperado)}
              </p>
            </div>
            {limite !== null && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full', excede ? 'bg-destructive' : 'bg-primary')}
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Abierta desde las {formatTime(resumen.caja.fecha_apertura)}
              {excede && <span className="ml-1 font-medium text-destructive">· excedida</span>}
            </p>
          </div>
        )
      })}
    </div>
  )
}
