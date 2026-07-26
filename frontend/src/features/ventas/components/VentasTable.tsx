import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Venta } from '@/services/ventaService'

interface VentasTableProps {
  ventas: Venta[]
  onVerDetalle: (venta: Venta) => void
}

export function VentasTable({ ventas, onVerDetalle }: VentasTableProps) {
  if (ventas.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay ventas registradas.</p>
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
            <TableCell>{new Date(venta.created_at).toLocaleString()}</TableCell>
            <TableCell>${venta.total}</TableCell>
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
