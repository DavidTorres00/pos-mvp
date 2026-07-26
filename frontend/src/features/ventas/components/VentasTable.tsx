import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { Venta } from '@/services/ventaService'

interface VentasTableProps {
  ventas: Venta[]
  onVerDetalle: (venta: Venta) => void
}

export function VentasTable({ ventas, onVerDetalle }: VentasTableProps) {
  if (ventas.length === 0) {
    return <EmptyState message="No hay ventas registradas." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Total</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {ventas.map((venta) => (
          <TableRow key={venta.id}>
            <TableCell>{formatDateTime(venta.created_at)}</TableCell>
            <TableCell className="font-semibold tabular-nums">{formatCurrency(venta.total)}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onVerDetalle(venta)}>
                Ver detalle
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
