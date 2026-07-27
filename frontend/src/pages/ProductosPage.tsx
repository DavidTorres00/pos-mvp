import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'
import { ProductoForm } from '@/features/productos/components/ProductoForm'
import { ProductosTable } from '@/features/productos/components/ProductosTable'
import { useCrearProducto, useSetEstadoProducto, useUpdateProducto } from '@/features/productos/hooks/useProductoMutations'
import { useProductos } from '@/features/productos/hooks/useProductos'
import type { ProductoFormValues } from '@/features/productos/schemas/productoSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Producto } from '@/services/productoService'
import { useAuthStore } from '@/stores/authStore'

export function ProductosPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const dialog = useCrudDialogState<Producto>()
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const { page, size, setPage } = usePagination(10, debouncedSearch)
  const { data, isLoading, isError } = useProductos(debouncedSearch, page, size)
  const productos = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const create = useCrearProducto()
  const update = useUpdateProducto()
  const setEstado = useSetEstadoProducto()

  function handleCreate(values: ProductoFormValues) {
    create.mutate(values, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: ProductoFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, payload: values }, { onSuccess: dialog.closeEdit })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Productos</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre o SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Buscar productos"
        />
        {isAdmin && (
          <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Nuevo producto</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo producto</DialogTitle>
              </DialogHeader>
              <ProductoForm
                isPending={create.isPending}
                errorMessage={
                  create.isError ? getApiErrorMessage(create.error, 'No se pudo crear el producto') : undefined
                }
                onSubmit={handleCreate}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : (
        <>
          <ProductosTable
            productos={productos}
            canManage={isAdmin}
            onEdit={dialog.edit}
            onToggleEstado={(producto) => setEstado.mutate({ id: producto.id, activo: !producto.activo })}
          />
          <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <ProductoForm
              defaultValues={{
                nombre: dialog.editing.nombre,
                sku: dialog.editing.sku,
                precio_venta: Number(dialog.editing.precio_venta),
                categoria_id: dialog.editing.categoria_id,
              }}
              isPending={update.isPending}
              errorMessage={
                update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar el producto') : undefined
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
