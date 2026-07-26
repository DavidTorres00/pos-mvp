import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { Compra } from '@/services/compraService'

interface ComprasTableProps {
  compras: Compra[]
  onVerDetalle: (compra: Compra) => void
}

export function ComprasTable({ compras, onVerDetalle }: ComprasTableProps) {
  if (compras.length === 0) {
    return <EmptyState message="No hay compras registradas." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Proveedor</TableHead>
          <TableHead>Total</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {compras.map((compra) => (
          <TableRow key={compra.id}>
            <TableCell>{formatDateTime(compra.created_at)}</TableCell>
            <TableCell>{compra.proveedor}</TableCell>
            <TableCell className="font-semibold tabular-nums">{formatCurrency(compra.total)}</TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onVerDetalle(compra)}>
                Ver detalle
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
