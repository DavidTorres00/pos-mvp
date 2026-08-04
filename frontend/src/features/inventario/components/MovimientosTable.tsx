import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Movimiento } from '@/services/inventarioService'

interface MovimientosTableProps {
  movimientos: Movimiento[]
  emptyMessage?: string
}

export function MovimientosTable({ movimientos, emptyMessage = 'No hay movimientos registrados.' }: MovimientosTableProps) {
  if (movimientos.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Stock actual</TableHead>
          <TableHead>Motivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento) => (
          <TableRow key={movimiento.id}>
            <TableCell>{formatDateTime(movimiento.created_at)}</TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span>{movimiento.producto.nombre}</span>
                <span className="text-xs text-muted-foreground">SKU: {movimiento.producto.sku}</span>
              </div>
            </TableCell>
            <TableCell>
              {movimiento.tipo === 'entrada' ? (
                <Badge className="bg-success/10 text-success">
                  <ArrowUpIcon />
                  Entrada
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <ArrowDownIcon />
                  Salida
                </Badge>
              )}
            </TableCell>
            <TableCell
              className={cn(
                'font-semibold tabular-nums',
                movimiento.tipo === 'entrada' ? 'text-success' : 'text-destructive',
              )}
            >
              {movimiento.tipo === 'entrada' ? '+' : '-'}
              {movimiento.cantidad}
            </TableCell>
            <TableCell className="font-semibold tabular-nums">{movimiento.stock_resultante}</TableCell>
            <TableCell>{movimiento.motivo ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
