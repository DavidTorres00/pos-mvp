import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ProductoForm } from '@/features/productos/components/ProductoForm'
import { ProductosTable } from '@/features/productos/components/ProductosTable'
import { useCreateProducto, useSetEstadoProducto, useUpdateProducto } from '@/features/productos/hooks/useProductoMutations'
import { useProductos } from '@/features/productos/hooks/useProductos'
import type { ProductoFormValues } from '@/features/productos/schemas/productoSchema'
import type { Producto } from '@/services/productoService'

export function ProductosPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)

  const { data: productos = [], isLoading } = useProductos(search)
  const create = useCreateProducto()
  const update = useUpdateProducto()
  const setEstado = useSetEstadoProducto()

  function handleCreate(values: ProductoFormValues) {
    create.mutate(values, { onSuccess: () => setCreateOpen(false) })
  }

  function handleUpdate(values: ProductoFormValues) {
    if (!editing) return
    update.mutate({ id: editing.id, payload: values }, { onSuccess: () => setEditing(null) })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo producto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo producto</DialogTitle>
            </DialogHeader>
            <ProductoForm isPending={create.isPending} errorMessage={create.isError ? 'No se pudo crear el producto' : undefined} onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <ProductosTable
          productos={productos}
          onEdit={setEditing}
          onToggleEstado={(producto) => setEstado.mutate({ id: producto.id, activo: !producto.activo })}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {editing && (
            <ProductoForm
              defaultValues={{
                nombre: editing.nombre,
                sku: editing.sku,
                precio_venta: Number(editing.precio_venta),
                categoria_id: editing.categoria_id,
              }}
              isPending={update.isPending}
              errorMessage={update.isError ? 'No se pudo actualizar el producto' : undefined}
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
