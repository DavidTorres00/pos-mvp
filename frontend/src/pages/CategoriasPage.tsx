import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TableCard } from '@/components/TableCard'
import { CategoriaForm } from '@/features/categorias/components/CategoriaForm'
import { CategoriasTable } from '@/features/categorias/components/CategoriasTable'
import { useCrearCategoria, useSetEstadoCategoria, useUpdateCategoria } from '@/features/categorias/hooks/useCategoriaMutations'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import type { CategoriaFormValues } from '@/features/categorias/schemas/categoriaSchema'
import { SubcategoriasDialog } from '@/features/subcategorias/components/SubcategoriasDialog'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Categoria } from '@/services/categoriaService'
import { useAuthStore } from '@/stores/authStore'

export function CategoriasPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const dialog = useCrudDialogState<Categoria>()
  const [subcategoriasDe, setSubcategoriasDe] = useState<Categoria | null>(null)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const { page, size, setPage } = usePagination(10, debouncedSearch)
  const { data, isLoading, isError } = useCategorias(debouncedSearch, page, size)
  const categorias = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const create = useCrearCategoria()
  const update = useUpdateCategoria()
  const setEstado = useSetEstadoCategoria()
  const hayFiltrosActivos = search !== ''

  function handleCreate(values: CategoriaFormValues) {
    create.mutate(values, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: CategoriaFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, payload: values }, { onSuccess: dialog.closeEdit })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Categorías</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Categorías</h1>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm"
            aria-label="Buscar categorías"
          />
          {hayFiltrosActivos && (
            <Button variant="ghost" onClick={() => setSearch('')}>
              Limpiar filtros
            </Button>
          )}
        </div>
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

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <CategoriasTable
          categorias={categorias}
          canManage={isAdmin}
          emptyMessage={hayFiltrosActivos ? 'No hay categorías que coincidan con tu búsqueda.' : 'No hay categorías.'}
          onEdit={dialog.edit}
          onToggleEstado={(categoria) => setEstado.mutate({ id: categoria.id, activo: !categoria.activo })}
          onManageSubcategorias={setSubcategoriasDe}
        />
      </TableCard>

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

      <SubcategoriasDialog
        categoria={subcategoriasDe}
        isAdmin={isAdmin}
        onOpenChange={(open) => !open && setSubcategoriasDe(null)}
      />
    </div>
  )
}
