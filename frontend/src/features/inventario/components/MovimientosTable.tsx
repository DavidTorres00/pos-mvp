import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatDateTime } from '@/lib/format'
import type { Movimiento } from '@/services/inventarioService'

interface MovimientosTableProps {
  movimientos: Movimiento[]
}

export function MovimientosTable({ movimientos }: MovimientosTableProps) {
  if (movimientos.length === 0) {
    return <EmptyState message="No hay movimientos registrados." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Producto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cantidad</TableHead>
          <TableHead>Motivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento) => (
          <TableRow key={movimiento.id}>
            <TableCell>{formatDateTime(movimiento.created_at)}</TableCell>
            <TableCell>{movimiento.producto.nombre}</TableCell>
            <TableCell>
              <Badge variant={movimiento.tipo === 'entrada' ? 'default' : 'secondary'}>
                {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              </Badge>
            </TableCell>
            <TableCell>{movimiento.cantidad}</TableCell>
            <TableCell>{movimiento.motivo ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
