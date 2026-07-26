import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { MovimientoCaja } from '@/services/cajaService'

interface MovimientosCajaTableProps {
  movimientos: MovimientoCaja[]
}

export function MovimientosCajaTable({ movimientos }: MovimientosCajaTableProps) {
  if (movimientos.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin movimientos manuales en este turno.</p>
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
            <TableCell>{new Date(movimiento.created_at).toLocaleString()}</TableCell>
            <TableCell>
              <Badge variant={movimiento.tipo === 'entrada' ? 'default' : 'secondary'}>
                {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
              </Badge>
            </TableCell>
            <TableCell>${movimiento.monto}</TableCell>
            <TableCell>{movimiento.motivo ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
