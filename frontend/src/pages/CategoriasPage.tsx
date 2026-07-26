import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'
import { CategoriaForm } from '@/features/categorias/components/CategoriaForm'
import { CategoriasTable } from '@/features/categorias/components/CategoriasTable'
import { useCreateCategoria, useSetEstadoCategoria, useUpdateCategoria } from '@/features/categorias/hooks/useCategoriaMutations'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import type { CategoriaFormValues } from '@/features/categorias/schemas/categoriaSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Categoria } from '@/services/categoriaService'

export function CategoriasPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const dialog = useCrudDialogState<Categoria>()

  const { data: categorias = [], isLoading, isError } = useCategorias(debouncedSearch)
  const { pageItems, page, pageCount, setPage, total } = usePagination(categorias, 10, debouncedSearch)
  const create = useCreateCategoria()
  const update = useUpdateCategoria()
  const setEstado = useSetEstadoCategoria()

  function handleCreate(values: CategoriaFormValues) {
    create.mutate(values, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: CategoriaFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, payload: values }, { onSuccess: dialog.closeEdit })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Categorías</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Buscar categorías"
        />
        <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nueva categoría</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <CategoriaForm
              isPending={create.isPending}
              errorMessage={
                create.isError ? getApiErrorMessage(create.error, 'No se pudo crear la categoría') : undefined
              }
              onSubmit={handleCreate}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : (
        <>
          <CategoriasTable
            categorias={pageItems}
            onEdit={dialog.edit}
            onToggleEstado={(categoria) => setEstado.mutate({ id: categoria.id, activo: !categoria.activo })}
          />
          <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <CategoriaForm
              defaultValues={{ nombre: dialog.editing.nombre }}
              isPending={update.isPending}
              errorMessage={
                update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar la categoría') : undefined
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
