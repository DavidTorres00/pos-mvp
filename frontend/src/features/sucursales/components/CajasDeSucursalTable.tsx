import { useEffect, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EquipoCajaEstado } from '@/services/sucursalService'

interface EquipoObjetivo {
  id: number
  nombre: string
}

interface CajasDeSucursalTableProps {
  cajas: EquipoCajaEstado[]
  emptyMessage?: string
  // llegada desde una alerta del Dashboard: resalta y hace scroll a esa fila exacta en vez de
  // dejar al admin buscarla entre todas las cajas de la sucursal
  equipoIdResaltado?: number | null
  onEditarEquipo: (equipo: EquipoObjetivo) => void
  onToggleEstadoEquipo: (equipo: EquipoObjetivo & { activo: boolean }) => void
  onRetirarExcedente: (cajero: EquipoObjetivo) => void
  onCerrarCaja: (cajero: EquipoObjetivo) => void
}

const ESTADO_BADGE = {
  abierta: { label: 'Abierta', variant: 'outline' as const },
  excedida: { label: 'Excedida', variant: 'destructive' as const },
  cerrada: { label: 'Cerrada', variant: 'secondary' as const },
}

export function CajasDeSucursalTable({
  cajas,
  emptyMessage = 'No hay cajas configuradas en esta sucursal.',
  equipoIdResaltado = null,
  onEditarEquipo,
  onToggleEstadoEquipo,
  onRetirarExcedente,
  onCerrarCaja,
}: CajasDeSucursalTableProps) {
  const [pendienteToggle, setPendienteToggle] = useState<EquipoCajaEstado | null>(null)

  useEffect(() => {
    if (equipoIdResaltado === null) return
    document.getElementById(`caja-equipo-${equipoIdResaltado}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [equipoIdResaltado, cajas.length])

  if (cajas.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Caja</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Cajero en turno</TableHead>
            <TableHead>Límite de efectivo</TableHead>
            <TableHead>Activo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {cajas.map((caja) => {
            const badge = ESTADO_BADGE[caja.estado]
            const tieneCajero = caja.cajero_usuario_id !== null && caja.cajero_nombre !== null
            const resaltada = caja.equipo_id === equipoIdResaltado
            return (
              <TableRow
                key={caja.equipo_id}
                id={`caja-equipo-${caja.equipo_id}`}
                className={cn(resaltada && 'bg-primary/10 outline outline-2 -outline-offset-2 outline-primary')}
              >
                <TableCell className="font-medium">{caja.equipo_nombre}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {caja.estado !== 'cerrada' && caja.fecha_apertura && (
                      <span className="text-xs text-muted-foreground">Desde las {formatTime(caja.fecha_apertura)}</span>
                    )}
                    {caja.estado === 'cerrada' && caja.ultimo_cierre && (
                      <span className="text-xs text-muted-foreground">
                        Último corte {formatDateTime(caja.ultimo_cierre)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tieneCajero ? (
                    <>
                      {caja.cajero_nombre}
                      {caja.monto_esperado && (
                        <span className="ml-1.5 tabular-nums">({formatCurrency(caja.monto_esperado)})</span>
                      )}
                    </>
                  ) : (
                    'Sin asignar'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {caja.limite_efectivo ? formatCurrency(caja.limite_efectivo) : 'Sin límite'}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={caja.equipo_activo}
                    onCheckedChange={() => setPendienteToggle(caja)}
                    aria-label={caja.equipo_activo ? `Desactivar ${caja.equipo_nombre}` : `Activar ${caja.equipo_nombre}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    {tieneCajero && caja.estado === 'excedida' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onRetirarExcedente({ id: caja.cajero_usuario_id as number, nombre: caja.cajero_nombre as string })
                        }
                      >
                        Retirar excedente
                      </Button>
                    )}
                    {tieneCajero && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          onCerrarCaja({ id: caja.cajero_usuario_id as number, nombre: caja.cajero_nombre as string })
                        }
                      >
                        Cerrar caja
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditarEquipo({ id: caja.equipo_id, nombre: caja.equipo_nombre })}
                    >
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <AlertDialog open={pendienteToggle !== null} onOpenChange={(open) => !open && setPendienteToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendienteToggle?.equipo_activo
                ? `¿Desactivar ${pendienteToggle?.equipo_nombre}?`
                : `¿Activar ${pendienteToggle?.equipo_nombre}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendienteToggle?.equipo_activo
                ? 'Ningún cajero podrá abrir caja en este equipo hasta que lo reactives.'
                : 'Volverá a estar disponible para abrir caja.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendienteToggle) {
                  onToggleEstadoEquipo({
                    id: pendienteToggle.equipo_id,
                    nombre: pendienteToggle.equipo_nombre,
                    activo: !pendienteToggle.equipo_activo,
                  })
                }
                setPendienteToggle(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
