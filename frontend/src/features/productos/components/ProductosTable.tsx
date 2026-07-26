import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Producto } from '@/services/productoService'

interface ProductosTableProps {
  productos: Producto[]
  onEdit: (producto: Producto) => void
  onToggleEstado: (producto: Producto) => void
}

export function ProductosTable({ productos, onEdit, onToggleEstado }: ProductosTableProps) {
  if (productos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay productos.</p>
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
            <TableCell>${producto.precio_venta}</TableCell>
            <TableCell>{producto.stock}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch checked={producto.activo} onCheckedChange={() => onToggleEstado(producto)} />
                <Badge variant={producto.activo ? 'default' : 'secondary'}>
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </Badge>
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
