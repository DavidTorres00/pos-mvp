import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { formatCurrency } from '@/lib/format'
import type { ProductoConStock } from '@/services/productoService'

interface ProductosTableProps {
  productos: ProductoConStock[]
  canManage: boolean
  emptyMessage?: string
  onEdit: (producto: ProductoConStock) => void
  onToggleEstado: (producto: ProductoConStock) => void
}

export function ProductosTable({
  productos,
  canManage,
  emptyMessage = 'No hay productos.',
  onEdit,
  onToggleEstado,
}: ProductosTableProps) {
  const [pending, setPending] = useState<ProductoConStock | null>(null)

  if (productos.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <>
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
              <TableCell>
                {producto.subcategoria
                  ? `${producto.subcategoria.categoria.nombre} > ${producto.subcategoria.nombre}`
                  : producto.categoria?.nombre ?? '—'}
              </TableCell>
              <TableCell className="font-semibold tabular-nums">{formatCurrency(producto.precio_venta)}</TableCell>
              <TableCell>{producto.stock}</TableCell>
              <TableCell>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={producto.activo}
                      onCheckedChange={() => setPending(producto)}
                      aria-label={producto.activo ? `Desactivar ${producto.nombre}` : `Activar ${producto.nombre}`}
                    />
                    <span className={producto.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ) : (
                  <span className={producto.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                    {producto.activo ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(producto)}>
                    Editar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.activo ? `¿Desactivar ${pending?.nombre}?` : `¿Activar ${pending?.nombre}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.activo
                ? 'El producto dejará de estar disponible para la venta.'
                : 'El producto volverá a estar disponible para la venta.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) onToggleEstado(pending)
                setPending(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
