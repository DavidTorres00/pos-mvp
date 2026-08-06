import {
  AlertTriangleIcon,
  BoxesIcon,
  CheckIcon,
  CircleCheckIcon,
  ClipboardCheckIcon,
  ClipboardListIcon,
  ClockIcon,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatHaceTiempo } from '@/lib/format'
import type { Alerta, AlertaTipo } from '@/services/reporteService'

const ALERTA_CONFIG: Record<AlertaTipo, { icon: LucideIcon; accionLabel: string; badge: string }> = {
  caja_excedida: { icon: AlertTriangleIcon, accionLabel: 'Ver cajero', badge: 'Caja' },
  orden_reorden_pendiente: { icon: ClipboardCheckIcon, accionLabel: 'Aprobar', badge: 'Compras' },
  orden_reorden_error: { icon: ClipboardCheckIcon, accionLabel: 'Revisar', badge: 'Compras' },
  caja_sin_cierre: { icon: ClockIcon, accionLabel: 'Cerrar caja', badge: 'Corte pendiente' },
  stock_bajo_sin_regla: { icon: BoxesIcon, accionLabel: 'Ver productos', badge: 'Inventario' },
  faltante_caja: { icon: ClipboardListIcon, accionLabel: 'Revisar', badge: 'Auditoría' },
}

// lleva a la fila exacta (sucursal+caja, o el evento de auditoría) cuando la alerta trae los
// ids — no solo a la página general, ver `docs/FRONTEND.md`. Las alertas agregadas (reorden,
// stock bajo sin una sola sucursal) no tienen una fila puntual a la que apuntar.
function construirRuta(alerta: Alerta): string {
  switch (alerta.tipo) {
    case 'caja_excedida':
    case 'caja_sin_cierre': {
      if (alerta.sucursal_id === null) return '/sucursales'
      const params = new URLSearchParams({ sucursalId: String(alerta.sucursal_id) })
      if (alerta.equipo_id !== null) params.set('equipoId', String(alerta.equipo_id))
      return `/sucursales?${params.toString()}`
    }
    case 'orden_reorden_pendiente':
    case 'orden_reorden_error':
      return '/ordenes-reorden'
    case 'stock_bajo_sin_regla':
      return '/productos'
    case 'faltante_caja':
      return alerta.auditoria_id !== null ? `/auditoria?highlightId=${alerta.auditoria_id}` : '/auditoria'
  }
}

interface AtencionFeedProps {
  alertas: Alerta[]
  // solo faltante_caja lo usa (hecho histórico inmutable, ver docs/BACKEND.md) — las demás
  // alertas describen una condición viva que se resuelve sola, no se pueden acusar a mano
  onAcusar: (alerta: Alerta) => void
  acusandoAuditoriaId?: number | null
}

export function AtencionFeed({ alertas, onAcusar, acusandoAuditoriaId = null }: AtencionFeedProps) {
  if (alertas.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center text-sm">
        <CircleCheckIcon className="size-6 text-success" />
        <p className="font-medium text-foreground">Todo en orden</p>
        <p className="text-muted-foreground">
          Ninguna caja excedida, ninguna orden pendiente y ningún producto bajo umbral.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col divide-y">
      {alertas.map((alerta, index) => {
        const config = ALERTA_CONFIG[alerta.tipo]
        return (
          <div key={index} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <config.icon className="size-4" />
              </span>
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{alerta.titulo}</p>
                  <Badge variant="outline">{config.badge}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alerta.descripcion}</p>
                <p className="text-xs text-muted-foreground">
                  {alerta.sucursal_nombre ?? 'Todas las sucursales'}
                  {alerta.created_at && ` · ${formatHaceTiempo(alerta.created_at)}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={construirRuta(alerta)}>{config.accionLabel}</Link>
              </Button>
              {alerta.tipo === 'faltante_caja' && alerta.auditoria_id !== null && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={acusandoAuditoriaId === alerta.auditoria_id}
                  onClick={() => onAcusar(alerta)}
                >
                  <CheckIcon className="size-4" />
                  Ya lo revisé
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
