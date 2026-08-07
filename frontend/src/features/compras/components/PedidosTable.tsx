import { useState } from 'react'

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Compra, EstadoCompra } from '@/services/compraService'

const ESTADO_LABEL: Record<EstadoCompra, string> = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  error: 'Error de pago',
  rechazada: 'Rechazada',
  recibida: 'Recibida',
}

const ESTADO_CLASSNAME: Record<EstadoCompra, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  pagada: 'bg-primary/10 text-primary',
  error: 'bg-destructive/10 text-destructive',
  rechazada: 'bg-destructive/10 text-destructive',
  recibida: 'bg-success/10 text-success',
}

interface PedidosTableProps {
  pedidos: Compra[]
  emptyMessage?: string
  // se oculta dentro del hub de un proveedor: la tabla ya está scopeada a uno solo
  showProveedor?: boolean
  onVerDetalle: (pedido: Compra) => void
  onAprobar: (pedido: Compra) => void
  onRechazar: (pedido: Compra) => void
  onRecibir: (pedido: Compra) => void
  aprobandoId?: number | null
  rechazandoId?: number | null
}

export function PedidosTable({
  pedidos,
  emptyMessage = 'No hay pedidos.',
  showProveedor = true,
  onVerDetalle,
  onAprobar,
  onRechazar,
  onRecibir,
  aprobandoId = null,
  rechazandoId = null,
}: PedidosTableProps) {
  const [rechazando, setRechazando] = useState<Compra | null>(null)
  const [aprobando, setAprobando] = useState<Compra | null>(null)

  if (pedidos.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            {showProveedor && <TableHead>Proveedor</TableHead>}
            <TableHead>Estado</TableHead>
            <TableHead>Total</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <TableRow key={pedido.id}>
              <TableCell>{formatDateTime(pedido.created_at)}</TableCell>
              {showProveedor && <TableCell>{pedido.proveedor.nombre}</TableCell>}
              <TableCell>
                <Badge variant="outline" className={cn('border-transparent', ESTADO_CLASSNAME[pedido.estado])}>
                  {ESTADO_LABEL[pedido.estado]}
                </Badge>
                {pedido.estado === 'error' && pedido.error && (
                  <p className="mt-1 max-w-64 text-xs text-destructive">{pedido.error}</p>
                )}
              </TableCell>
              <TableCell className="font-semibold tabular-nums">{formatCurrency(pedido.total)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onVerDetalle(pedido)}>
                    Ver detalle
                  </Button>
                  {(pedido.estado === 'pendiente' || pedido.estado === 'error') && (
                    <>
                      <Button
                        size="sm"
                        disabled={aprobandoId === pedido.id}
                        onClick={() => setAprobando(pedido)}
                      >
                        {aprobandoId === pedido.id
                          ? 'Pagando...'
                          : pedido.estado === 'error'
                            ? 'Reintentar pago'
                            : 'Aprobar y pagar'}
                      </Button>
                      {pedido.estado === 'pendiente' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          disabled={rechazandoId === pedido.id}
                          onClick={() => setRechazando(pedido)}
                        >
                          Rechazar
                        </Button>
                      )}
                    </>
                  )}
                  {pedido.estado === 'pagada' && (
                    <Button size="sm" onClick={() => onRecibir(pedido)}>
                      Registrar recepción
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={rechazando !== null} onOpenChange={(open) => !open && setRechazando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar este pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cancela sin pagar nada. No podrás aprobarlo después — tendrías que armar uno nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (rechazando) onRechazar(rechazando)
                setRechazando(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={aprobando !== null} onOpenChange={(open) => !open && setAprobando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Pagar {aprobando ? formatCurrency(aprobando.total) : ''} a {aprobando?.proveedor.nombre}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Es un pago real e irreversible vía transferencia. Confirma solo si ya verificaste el pedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (aprobando) onAprobar(aprobando)
                setAprobando(null)
              }}
            >
              Pagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
