import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { StockCell } from '@/components/StockCell'
import { formatCurrency } from '@/lib/format'
import type { ProductoConStock } from '@/services/productoService'

interface ProductosParaVentaTableProps {
  productos: ProductoConStock[]
  emptyMessage?: string
  agregadoId: number | null
  onAgregar: (producto: ProductoConStock) => void
}

// Tabla reducida para el picker de productos del cajero: sin Categoría (no lo necesita para
// ubicar un producto ya conocido) ni Estado (este listado ya solo trae productos activos, ver
// `activo: true` en ProductoPickerPanel) — a diferencia de `ProductosTable` (admin), que sí
// gestiona ambos.
export function ProductosParaVentaTable({
  productos,
  emptyMessage = 'No hay productos.',
  agregadoId,
  onAgregar,
}: ProductosParaVentaTableProps) {
  if (productos.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead className="text-right">Stock</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {productos.map((producto) => (
          <TableRow key={producto.id}>
            <TableCell className="font-medium">{producto.nombre}</TableCell>
            <TableCell className="text-muted-foreground">{producto.sku}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">
              {formatCurrency(producto.precio_venta)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              <StockCell stock={producto.stock} />
            </TableCell>
            <TableCell>
              <Button
                variant={agregadoId === producto.id ? 'secondary' : 'outline'}
                size="sm"
                disabled={producto.stock === 0}
                onClick={() => onAgregar(producto)}
              >
                {agregadoId === producto.id ? (
                  'Agregado'
                ) : (
                  <>
                    <PlusIcon /> Agregar
                  </>
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
