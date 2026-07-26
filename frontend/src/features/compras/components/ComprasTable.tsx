import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Compra } from '@/services/compraService'

interface ComprasTableProps {
  compras: Compra[]
  onVerDetalle: (compra: Compra) => void
}

export function ComprasTable({ compras, onVerDetalle }: ComprasTableProps) {
  if (compras.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay compras registradas.</p>
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
            <TableCell>{new Date(compra.created_at).toLocaleString()}</TableCell>
            <TableCell>{compra.proveedor}</TableCell>
            <TableCell>${compra.total}</TableCell>
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
