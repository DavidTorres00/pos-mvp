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
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency } from '@/lib/format'
import type { ReglaReorden } from '@/services/reglaReordenService'

interface ReglasReordenTableProps {
  reglas: ReglaReorden[]
  onEdit: (regla: ReglaReorden) => void
  onToggleEstado: (regla: ReglaReorden) => void
}

export function ReglasReordenTable({ reglas, onEdit, onToggleEstado }: ReglasReordenTableProps) {
  const [pending, setPending] = useState<ReglaReorden | null>(null)

  if (reglas.length === 0) {
    return <EmptyState message="No hay reglas de reorden configuradas." />
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Umbral</TableHead>
          <TableHead>Cantidad a pedir</TableHead>
          <TableHead>Costo estimado</TableHead>
          <TableHead>Activa</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reglas.map((regla) => (
          <TableRow key={regla.id}>
            <TableCell>{regla.producto.nombre}</TableCell>
            <TableCell>{regla.proveedor.nombre}</TableCell>
            <TableCell className="tabular-nums">{regla.umbral_stock}</TableCell>
            <TableCell className="tabular-nums">{regla.cantidad_pedido}</TableCell>
            <TableCell className="tabular-nums">{formatCurrency(regla.costo_unitario_estimado)}</TableCell>
            <TableCell>
              <Switch
                checked={regla.activo}
                onCheckedChange={() => setPending(regla)}
                aria-label={regla.activo ? `Desactivar regla de ${regla.producto.nombre}` : `Activar regla de ${regla.producto.nombre}`}
              />
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onEdit(regla)}>
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {pending?.activo ? `¿Desactivar regla de ${pending?.producto.nombre}?` : `¿Activar regla de ${pending?.producto.nombre}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.activo
              ? 'Dejará de disparar órdenes de reorden automáticas para este producto.'
              : 'Volverá a disparar órdenes de reorden automáticas al llegar al umbral.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (pending) onToggleEstado(pending)
              setPending(null)
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
