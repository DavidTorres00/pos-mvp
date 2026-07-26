import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CategoriaForm } from '@/features/categorias/components/CategoriaForm'
import { CategoriasTable } from '@/features/categorias/components/CategoriasTable'
import { useCreateCategoria, useSetEstadoCategoria, useUpdateCategoria } from '@/features/categorias/hooks/useCategoriaMutations'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import type { CategoriaFormValues } from '@/features/categorias/schemas/categoriaSchema'
import type { Categoria } from '@/services/categoriaService'

export function CategoriasPage() {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)

  const { data: categorias = [], isLoading } = useCategorias(search)
  const create = useCreateCategoria()
  const update = useUpdateCategoria()
  const setEstado = useSetEstadoCategoria()

  function handleCreate(values: CategoriaFormValues) {
    create.mutate(values, { onSuccess: () => setCreateOpen(false) })
  }

  function handleUpdate(values: CategoriaFormValues) {
    if (!editing) return
    update.mutate({ id: editing.id, payload: values }, { onSuccess: () => setEditing(null) })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nueva categoría</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <CategoriaForm
              isPending={create.isPending}
              errorMessage={create.isError ? 'No se pudo crear la categoría' : undefined}
              onSubmit={handleCreate}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <CategoriasTable
          categorias={categorias}
          onEdit={setEditing}
          onToggleEstado={(categoria) => setEstado.mutate({ id: categoria.id, activo: !categoria.activo })}
        />
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {editing && (
            <CategoriaForm
              defaultValues={{ nombre: editing.nombre }}
              isPending={update.isPending}
              errorMessage={update.isError ? 'No se pudo actualizar la categoría' : undefined}
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
