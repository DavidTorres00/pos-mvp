import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CajaResumen } from '@/services/cajaService'

interface CierreResumenProps {
  resumen: CajaResumen
  isPending: boolean
  errorMessage?: string
  onSalir: () => void
}

// Resultado de "Terminar turno": antes del cierre se encadenaba el logout de inmediato al
// confirmar el monto final, sin que el cajero viera si su conteo cuadró contra lo esperado —
// la diferencia ya se calculaba (`caja_service.cerrar`) pero solo quedaba en auditoría, admin-only.
export function CierreResumen({ resumen, isPending, errorMessage, onSalir }: CierreResumenProps) {
  const diferencia = Number(resumen.diferencia ?? 0)
  const cuadra = diferencia === 0
  const sobrante = diferencia > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 rounded-md border p-3 text-sm">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Monto inicial</span>
          <span>{formatCurrency(resumen.caja.monto_inicial)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Ventas en efectivo</span>
          <span>{formatCurrency(resumen.total_ventas_efectivo)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Otras entradas</span>
          <span>{formatCurrency(resumen.total_entradas)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Otras salidas</span>
          <span>{formatCurrency(resumen.total_salidas)}</span>
        </p>
        <p className="flex justify-between border-t pt-1.5 font-semibold">
          <span>Monto esperado</span>
          <span>{formatCurrency(resumen.monto_esperado)}</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>Monto final contado</span>
          <span>{formatCurrency(resumen.caja.monto_final ?? '0')}</span>
        </p>
      </div>

      <div
        className={cn(
          'rounded-md border p-3 text-sm font-semibold',
          cuadra
            ? 'border-success/30 bg-success/10 text-success'
            : sobrante
              ? 'border-primary/30 bg-primary/5 text-primary'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
        )}
      >
        {cuadra
          ? 'La caja cuadra exacto.'
          : sobrante
            ? // no es una pérdida — informativo, no una alerta
              `Sobraron ${formatCurrency(Math.abs(diferencia))} respecto a lo esperado.`
            : `Faltaron ${formatCurrency(Math.abs(diferencia))} respecto a lo esperado.`}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button onClick={onSalir} disabled={isPending}>
        {isPending ? 'Saliendo...' : 'Salir'}
      </Button>
    </div>
  )
}
