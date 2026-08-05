import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { EquipoForm } from '@/features/equipos/components/EquipoForm'
import { EquiposTable } from '@/features/equipos/components/EquiposTable'
import { useCrearEquipo, useSetEstadoEquipo, useUpdateEquipo } from '@/features/equipos/hooks/useEquipoMutations'
import { useEquipos } from '@/features/equipos/hooks/useEquipos'
import type { EquipoFormValues } from '@/features/equipos/schemas/equipoSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import type { Equipo } from '@/services/equipoService'
import type { Sucursal } from '@/services/sucursalService'

interface EquiposDialogProps {
  sucursal: Sucursal | null
  isAdmin: boolean
  onOpenChange: (open: boolean) => void
}

export function EquiposDialog({ sucursal, isAdmin, onOpenChange }: EquiposDialogProps) {
  const dialog = useCrudDialogState<Equipo>()
  const { data, isLoading, isError } = useEquipos(sucursal?.id ?? null)
  const equipos = data?.items ?? []
  const create = useCrearEquipo()
  const update = useUpdateEquipo()
  const setEstado = useSetEstadoEquipo()

  function handleCreate(values: EquipoFormValues) {
    if (!sucursal) return
    create.mutate({ ...values, sucursal_id: sucursal.id }, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: EquipoFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, nombre: values.nombre }, { onSuccess: dialog.closeEdit })
  }

  return (
    <>
      <Dialog open={sucursal !== null} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[80vh] flex-col overflow-hidden pt-12 sm:max-w-3xl">
          <div className="flex shrink-0 items-center justify-between gap-4">
            <DialogTitle>Equipos de {sucursal?.nombre}</DialogTitle>
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
              total={equipos.length}
              onPageChange={() => {}}
            >
              <EquiposTable
                equipos={equipos}
                canManage={isAdmin}
                emptyMessage="No hay equipos en esta sucursal."
                onEdit={dialog.edit}
                onToggleEstado={(equipo) => setEstado.mutate({ id: equipo.id, activo: !equipo.activo })}
              />
            </TableCard>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo equipo</DialogTitle>
          </DialogHeader>
          <EquipoForm
            isPending={create.isPending}
            errorMessage={create.isError ? getApiErrorMessage(create.error, 'No se pudo crear el equipo') : undefined}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar equipo</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <EquipoForm
              defaultValues={{ nombre: dialog.editing.nombre }}
              isPending={update.isPending}
              errorMessage={
                update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar el equipo') : undefined
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
