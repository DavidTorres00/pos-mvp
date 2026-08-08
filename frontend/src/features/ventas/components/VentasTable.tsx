import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { FORMA_PAGO_LABELS, type Venta } from '@/services/ventaService'

interface VentasTableProps {
  ventas: Venta[]
  onVerDetalle: (venta: Venta) => void
  emptyMessage?: string
  showSucursal?: boolean
}

export function VentasTable({
  ventas,
  onVerDetalle,
  emptyMessage = 'No hay ventas registradas.',
  showSucursal = true,
}: VentasTableProps) {
  if (ventas.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Folio</TableHead>
          <TableHead>Fecha</TableHead>
          {showSucursal && <TableHead>Sucursal</TableHead>}
          <TableHead>Cajero</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Forma de pago</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {ventas.map((venta) => (
          <TableRow key={venta.id}>
            <TableCell className="text-muted-foreground tabular-nums">#{venta.id}</TableCell>
            <TableCell>{formatDateTime(venta.created_at)}</TableCell>
            {showSucursal && <TableCell>{venta.sucursal_nombre}</TableCell>}
            <TableCell>{venta.usuario_nombre}</TableCell>
            <TableCell className="font-semibold tabular-nums">{formatCurrency(venta.total)}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={venta.forma_pago === 'efectivo' ? 'default' : 'secondary'}>
                  {FORMA_PAGO_LABELS[venta.forma_pago]}
                </Badge>
                {venta.estado === 'cancelada' && <Badge variant="destructive">Cancelada</Badge>}
              </div>
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
