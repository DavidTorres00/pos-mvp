import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { SubcategoriaForm } from '@/features/subcategorias/components/SubcategoriaForm'
import { SubcategoriasTable } from '@/features/subcategorias/components/SubcategoriasTable'
import {
  useCrearSubcategoria,
  useSetEstadoSubcategoria,
  useUpdateSubcategoria,
} from '@/features/subcategorias/hooks/useSubcategoriaMutations'
import { useSubcategorias } from '@/features/subcategorias/hooks/useSubcategorias'
import type { SubcategoriaFormValues } from '@/features/subcategorias/schemas/subcategoriaSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import type { Categoria } from '@/services/categoriaService'
import type { Subcategoria } from '@/services/subcategoriaService'

interface SubcategoriasDialogProps {
  categoria: Categoria | null
  isAdmin: boolean
  onOpenChange: (open: boolean) => void
}

export function SubcategoriasDialog({ categoria, isAdmin, onOpenChange }: SubcategoriasDialogProps) {
  const dialog = useCrudDialogState<Subcategoria>()
  const { data, isLoading, isError } = useSubcategorias(categoria?.id ?? null)
  const subcategorias = data?.items ?? []
  const create = useCrearSubcategoria()
  const update = useUpdateSubcategoria()
  const setEstado = useSetEstadoSubcategoria()

  function handleCreate(values: SubcategoriaFormValues) {
    if (!categoria) return
    create.mutate({ ...values, categoria_id: categoria.id }, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: SubcategoriaFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, nombre: values.nombre }, { onSuccess: dialog.closeEdit })
  }

  return (
    <>
      <Dialog open={categoria !== null} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden pt-12 sm:max-w-3xl">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <DialogTitle>Subcategorías de {categoria?.nombre}</DialogTitle>
            {isAdmin && (
              <Button size="sm" onClick={() => dialog.setCreateOpen(true)}>
                Agregar
              </Button>
            )}
          </div>
          <div className="overflow-y-auto">
            <TableCard
              isLoading={isLoading}
              isError={isError}
              page={1}
              pageCount={1}
              total={subcategorias.length}
              onPageChange={() => {}}
            >
              <SubcategoriasTable
                subcategorias={subcategorias}
                canManage={isAdmin}
                emptyMessage="No hay subcategorías en esta categoría."
                onEdit={dialog.edit}
                onToggleEstado={(subcategoria) => setEstado.mutate({ id: subcategoria.id, activo: !subcategoria.activo })}
              />
            </TableCard>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva subcategoría</DialogTitle>
          </DialogHeader>
          <SubcategoriaForm
            isPending={create.isPending}
            errorMessage={create.isError ? getApiErrorMessage(create.error, 'No se pudo crear la subcategoría') : undefined}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar subcategoría</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <SubcategoriaForm
              defaultValues={{ nombre: dialog.editing.nombre }}
              isPending={update.isPending}
              errorMessage={
                update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar la subcategoría') : undefined
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
