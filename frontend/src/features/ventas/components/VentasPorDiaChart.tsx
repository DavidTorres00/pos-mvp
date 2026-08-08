import { useState } from 'react'

import { EmptyState } from '@/components/DataStates'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { VentaPorDia } from '@/services/ventaService'

const etiquetaFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

// `fecha` llega como "YYYY-MM-DD" (sin hora): parsear con `new Date(string)` la lee como UTC
// medianoche, que en un huso negativo (America/Mexico_City) se muestra como el día anterior al
// renderizar en hora local — se arma la fecha a mano con las partes, en hora local.
function fechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

interface VentasPorDiaChartProps {
  datos: VentaPorDia[]
}

export function VentasPorDiaChart({ datos }: VentasPorDiaChartProps) {
  const [diaActivo, setDiaActivo] = useState<string | null>(null)

  if (datos.length === 0) {
    return <EmptyState message="No hay ventas en el período para graficar." bordered={false} />
  }

  const totales = datos.map((d) => Number(d.total_monto))
  const max = Math.max(1, ...totales)
  const diaPico = totales.every((t) => t === 0) ? null : totales.indexOf(Math.max(...totales))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-40 items-end gap-1">
        {datos.map((item, index) => {
          const total = Number(item.total_monto)
          const alturaPct = max > 0 ? Math.max(total > 0 ? 4 : 1, (total / max) * 100) : 1
          const esPico = index === diaPico
          return (
            <div
              key={item.fecha}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setDiaActivo(item.fecha)}
              onMouseLeave={() => setDiaActivo(null)}
            >
              {diaActivo === item.fecha && (
                <div className="absolute bottom-full mb-1.5 flex flex-col items-center rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md">
                  <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
                  <span className="text-muted-foreground">
                    {etiquetaFormatter.format(fechaLocal(item.fecha))} · {item.cantidad}{' '}
                    {item.cantidad === 1 ? 'venta' : 'ventas'}
                  </span>
                </div>
              )}
              <div
                role="img"
                aria-label={`${etiquetaFormatter.format(fechaLocal(item.fecha))} — ${formatCurrency(total)}, ${item.cantidad} ventas`}
                className={cn(
                  'w-full min-w-[3px] rounded-t-sm transition-colors',
                  esPico ? 'bg-primary' : 'bg-primary/40 group-hover:bg-primary/70',
                )}
                style={{ height: `${alturaPct}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 text-[10px] text-muted-foreground">
        {datos.map((item, index) => (
          <div key={item.fecha} className="flex-1 text-center">
            {datos.length <= 14 || index % Math.ceil(datos.length / 10) === 0
              ? etiquetaFormatter.format(fechaLocal(item.fecha))
              : ''}
          </div>
        ))}
      </div>
      {diaPico !== null && (
        <p className="text-right text-xs text-muted-foreground">
          Pico {etiquetaFormatter.format(fechaLocal(datos[diaPico].fecha))}
        </p>
      )}
    </div>
  )
}
