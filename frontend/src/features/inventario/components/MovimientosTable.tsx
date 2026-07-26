import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Movimiento } from '@/services/inventarioService'

interface MovimientosTableProps {
  movimientos: Movimiento[]
}

export function MovimientosTable({ movimientos }: MovimientosTableProps) {
  if (movimientos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay movimientos registrados.</p>
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
            <TableCell>{new Date(movimiento.created_at).toLocaleString()}</TableCell>
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
