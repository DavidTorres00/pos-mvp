import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { MovimientoCaja } from '@/services/cajaService'

interface MovimientosCajaTableProps {
  movimientos: MovimientoCaja[]
}

export function MovimientosCajaTable({ movimientos }: MovimientosCajaTableProps) {
  if (movimientos.length === 0) {
    return <EmptyState message="Sin movimientos manuales en este turno." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Monto</TableHead>
          <TableHead>Motivo</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movimientos.map((movimiento) => (
          <TableRow key={movimiento.id}>
            <TableCell>{formatDateTime(movimiento.created_at)}</TableCell>
            <TableCell>
              <Badge variant={movimiento.tipo === 'entrada' ? 'default' : 'secondary'}>
                {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              </Badge>
            </TableCell>
            <TableCell
              className={
                movimiento.tipo === 'entrada'
                  ? 'font-semibold tabular-nums text-success'
                  : 'font-semibold tabular-nums text-destructive'
              }
            >
              {movimiento.tipo === 'entrada' ? '+' : '−'}
              {formatCurrency(movimiento.monto)}
            </TableCell>
            <TableCell>{movimiento.motivo ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
