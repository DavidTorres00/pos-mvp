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
import type { OrdenReorden } from '@/services/ordenReordenService'

const ESTADO_LABELS: Record<OrdenReorden['estado'], string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  pagada: 'Pagada',
  error: 'Error al pagar',
}

const ESTADO_VARIANT: Record<OrdenReorden['estado'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'secondary',
  aprobada: 'default',
  rechazada: 'outline',
  pagada: 'default',
  error: 'destructive',
}

interface OrdenesReordenTableProps {
  ordenes: OrdenReorden[]
  onAprobar: (orden: OrdenReorden) => void
  onRechazar: (orden: OrdenReorden) => void
  aprobarPending: boolean
  rechazarPending: boolean
}

export function OrdenesReordenTable({
  ordenes,
  onAprobar,
  onRechazar,
  aprobarPending,
  rechazarPending,
}: OrdenesReordenTableProps) {
  const [confirmando, setConfirmando] = useState<OrdenReorden | null>(null)

  if (ordenes.length === 0) {
    return <EmptyState message="No hay órdenes de reorden." />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Monto estimado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.map((orden) => (
            <TableRow key={orden.id}>
              <TableCell className="whitespace-nowrap">{formatDateTime(orden.created_at)}</TableCell>
              <TableCell>{orden.producto.nombre}</TableCell>
              <TableCell>{orden.proveedor.nombre}</TableCell>
              <TableCell className="tabular-nums">{orden.cantidad}</TableCell>
              <TableCell className="tabular-nums">{formatCurrency(orden.monto_estimado)}</TableCell>
              <TableCell>
                <Badge variant={ESTADO_VARIANT[orden.estado]}>{ESTADO_LABELS[orden.estado]}</Badge>
                {orden.estado === 'error' && orden.error && (
                  <p className="mt-1 text-xs text-destructive">{orden.error}</p>
                )}
              </TableCell>
              <TableCell>
                {orden.estado === 'pendiente' && (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={aprobarPending} onClick={() => setConfirmando(orden)}>
                      Aprobar y pagar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={rechazarPending}
                      onClick={() => onRechazar(orden)}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={confirmando !== null} onOpenChange={(open) => !open && setConfirmando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar y pagar esta orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un pago real de {confirmando && formatCurrency(confirmando.monto_estimado)} a{' '}
              {confirmando?.proveedor.nombre} vía OpenPay. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmando) onAprobar(confirmando)
                setConfirmando(null)
              }}
            >
              Confirmar pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
