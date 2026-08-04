import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'
import { ProveedorForm } from '@/features/proveedores/components/ProveedorForm'
import { ProveedoresTable } from '@/features/proveedores/components/ProveedoresTable'
import {
  useCrearProveedor,
  useSetEstadoProveedor,
  useUpdateProveedor,
} from '@/features/proveedores/hooks/useProveedorMutations'
import { useProveedores } from '@/features/proveedores/hooks/useProveedores'
import type { ProveedorFormValues } from '@/features/proveedores/schemas/proveedorSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Proveedor } from '@/services/proveedorService'
import { useAuthStore } from '@/stores/authStore'

export function ProveedoresPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const dialog = useCrudDialogState<Proveedor>()
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const { page, size, setPage } = usePagination(10, debouncedSearch)
  const { data, isLoading, isError } = useProveedores(debouncedSearch, page, size)
  const proveedores = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const create = useCrearProveedor()
  const update = useUpdateProveedor()
  const setEstado = useSetEstadoProveedor()

  function handleCreate(values: ProveedorFormValues) {
    create.mutate(values, { onSuccess: dialog.closeCreate })
  }

  function handleUpdate(values: ProveedorFormValues) {
    if (!dialog.editing) return
    update.mutate({ id: dialog.editing.id, payload: values }, { onSuccess: dialog.closeEdit })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Proveedores</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tenés acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Proveedores</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
          aria-label="Buscar proveedores"
        />
        <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo proveedor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo proveedor</DialogTitle>
            </DialogHeader>
            <ProveedorForm
              isPending={create.isPending}
              errorMessage={
                create.isError ? getApiErrorMessage(create.error, 'No se pudo crear el proveedor') : undefined
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
          <ProveedoresTable
            proveedores={proveedores}
            onEdit={dialog.edit}
            onToggleEstado={(proveedor) => setEstado.mutate({ id: proveedor.id, activo: !proveedor.activo })}
          />
          <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <ProveedorForm
              defaultValues={{
                nombre: dialog.editing.nombre,
                contacto: dialog.editing.contacto ?? '',
                telefono: dialog.editing.telefono ?? '',
                email: dialog.editing.email ?? '',
                clabe: dialog.editing.clabe ?? '',
              }}
              isPending={update.isPending}
              errorMessage={
                update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar el proveedor') : undefined
              }
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
