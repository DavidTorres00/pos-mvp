import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { FormaPago, Venta } from '@/services/ventaService'

const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

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
          <TableHead>Forma de pago</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {ventas.map((venta) => (
          <TableRow key={venta.id}>
            <TableCell>{formatDateTime(venta.created_at)}</TableCell>
            <TableCell className="font-semibold tabular-nums">{formatCurrency(venta.total)}</TableCell>
            <TableCell>
              <Badge variant={venta.forma_pago === 'efectivo' ? 'default' : 'secondary'}>
                {FORMA_PAGO_LABELS[venta.forma_pago]}
              </Badge>
            </TableCell>
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
