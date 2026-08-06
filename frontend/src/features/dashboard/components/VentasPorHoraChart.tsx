import { useState } from 'react'

import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { VentasPorHoraItem } from '@/services/reporteService'

interface VentasPorHoraChartProps {
  datos: VentasPorHoraItem[]
}

const HORAS_ETIQUETADAS = new Set([0, 4, 8, 12, 16, 20])

export function VentasPorHoraChart({ datos }: VentasPorHoraChartProps) {
  const [horaActiva, setHoraActiva] = useState<number | null>(null)

  const totales = datos.map((d) => Number(d.total_ventas))
  const max = Math.max(1, ...totales)
  const horaPico = totales.every((t) => t === 0) ? null : totales.indexOf(Math.max(...totales))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-40 items-end gap-1">
        {datos.map((item, index) => {
          const total = Number(item.total_ventas)
          const alturaPct = max > 0 ? Math.max(total > 0 ? 4 : 1, (total / max) * 100) : 1
          const esPico = index === horaPico
          return (
            <div
              key={item.hora}
              className="group relative flex flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoraActiva(item.hora)}
              onMouseLeave={() => setHoraActiva(null)}
            >
              {horaActiva === item.hora && (
                <div className="absolute bottom-full mb-1.5 flex flex-col items-center rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md">
                  <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
                  <span className="text-muted-foreground">
                    {String(item.hora).padStart(2, '0')}:00 · {item.cantidad_ventas}{' '}
                    {item.cantidad_ventas === 1 ? 'venta' : 'ventas'}
                  </span>
                </div>
              )}
              <div
                role="img"
                aria-label={`${String(item.hora).padStart(2, '0')}:00 — ${formatCurrency(total)}, ${item.cantidad_ventas} ventas`}
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
        {datos.map((item) => (
          <div key={item.hora} className="flex-1 text-center">
            {HORAS_ETIQUETADAS.has(item.hora) ? `${item.hora}h` : ''}
          </div>
        ))}
      </div>
      {horaPico !== null && (
        <p className="text-right text-xs text-muted-foreground">
          Pico {String(datos[horaPico].hora).padStart(2, '0')}:00 h
        </p>
      )}
    </div>
  )
}
