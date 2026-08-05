import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { TableCard } from '@/components/TableCard'
import { EquiposDialog } from '@/features/equipos/components/EquiposDialog'
import { SucursalForm } from '@/features/sucursales/components/SucursalForm'
import { SucursalesTable } from '@/features/sucursales/components/SucursalesTable'
import {
  useCrearSucursal,
  useSetEstadoSucursal,
  useUpdateSucursal,
} from '@/features/sucursales/hooks/useSucursalMutations'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import type { SucursalFormValues } from '@/features/sucursales/schemas/sucursalSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Sucursal } from '@/services/sucursalService'
import { useAuthStore } from '@/stores/authStore'

export function SucursalesPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const dialog = useCrudDialogState<Sucursal>()
  const [equiposDe, setEquiposDe] = useState<Sucursal | null>(null)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const { page, size, setPage } = usePagination(10, debouncedSearch)
  const { data, isLoading, isError } = useSucursales(debouncedSearch, page, size)
  const sucursales = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const create = useCrearSucursal()
  const update = useUpdateSucursal()
  const setEstado = useSetEstadoSucursal()
  const hayFiltrosActivos = search !== ''

  function handleCreate(values: SucursalFormValues) {
    create.mutate(values, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: SucursalFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, payload: values }, { onSuccess: dialog.closeEdit })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Sucursales</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Sucursales</h1>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm"
            aria-label="Buscar sucursales"
          />
          {hayFiltrosActivos && (
            <Button variant="ghost" onClick={() => setSearch('')}>
              Limpiar filtros
            </Button>
          )}
        </div>
        <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nueva sucursal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva sucursal</DialogTitle>
            </DialogHeader>
            <SucursalForm
              isPending={create.isPending}
              errorMessage={
                create.isError ? getApiErrorMessage(create.error, 'No se pudo crear la sucursal') : undefined
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
        <SucursalesTable
          sucursales={sucursales}
          emptyMessage={hayFiltrosActivos ? 'No hay sucursales que coincidan con tu búsqueda.' : 'No hay sucursales.'}
          onEdit={dialog.edit}
          onToggleEstado={(sucursal) => setEstado.mutate({ id: sucursal.id, activo: !sucursal.activo })}
          onManageEquipos={setEquiposDe}
        />
      </TableCard>

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sucursal</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <SucursalForm
              defaultValues={{ nombre: dialog.editing.nombre }}
              isPending={update.isPending}
              errorMessage={
                update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar la sucursal') : undefined
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>

      <EquiposDialog sucursal={equiposDe} isAdmin={isAdmin} onOpenChange={(open) => !open && setEquiposDe(null)} />
    </div>
  )
}
