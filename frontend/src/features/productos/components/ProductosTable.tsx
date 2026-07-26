import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency } from '@/lib/format'
import type { Producto } from '@/services/productoService'

interface ProductosTableProps {
  productos: Producto[]
  onEdit: (producto: Producto) => void
  onToggleEstado: (producto: Producto) => void
}

export function ProductosTable({ productos, onEdit, onToggleEstado }: ProductosTableProps) {
  if (productos.length === 0) {
    return <EmptyState message="No hay productos." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Categoría</TableHead>
          <TableHead>Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {productos.map((producto) => (
          <TableRow key={producto.id}>
            <TableCell>{producto.nombre}</TableCell>
            <TableCell>{producto.sku}</TableCell>
            <TableCell>{producto.categoria?.nombre ?? '—'}</TableCell>
            <TableCell className="font-semibold tabular-nums">{formatCurrency(producto.precio_venta)}</TableCell>
            <TableCell>{producto.stock}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={producto.activo}
                  onCheckedChange={() => onToggleEstado(producto)}
                  aria-label={producto.activo ? `Desactivar ${producto.nombre}` : `Activar ${producto.nombre}`}
                />
                <span className={producto.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onEdit(producto)}>
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
