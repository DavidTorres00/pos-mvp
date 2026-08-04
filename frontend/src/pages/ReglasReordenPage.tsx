import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { ReglaReordenForm } from '@/features/reglas-reorden/components/ReglaReordenForm'
import { ReglasReordenTable } from '@/features/reglas-reorden/components/ReglasReordenTable'
import {
  useCrearReglaReorden,
  useSetEstadoReglaReorden,
  useUpdateReglaReorden,
} from '@/features/reglas-reorden/hooks/useReglaReordenMutations'
import { useReglasReorden } from '@/features/reglas-reorden/hooks/useReglasReorden'
import type { ReglaReordenFormValues } from '@/features/reglas-reorden/schemas/reglaReordenSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { usePagination } from '@/lib/hooks/usePagination'
import type { ReglaReorden } from '@/services/reglaReordenService'
import { useAuthStore } from '@/stores/authStore'

export function ReglasReordenPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const dialog = useCrudDialogState<ReglaReorden>()
  const { page, size, setPage } = usePagination(10)
  const { data, isLoading, isError } = useReglasReorden(page, size)
  const reglas = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const create = useCrearReglaReorden()
  const update = useUpdateReglaReorden()
  const setEstado = useSetEstadoReglaReorden()

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Reglas de reorden</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  function handleCreate(values: ReglaReordenFormValues) {
    create.mutate(
      {
        producto_id: values.producto_id as number,
        proveedor_id: values.proveedor_id as number,
        umbral_stock: values.umbral_stock,
        cantidad_pedido: values.cantidad_pedido,
        costo_unitario_estimado: values.costo_unitario_estimado,
      },
      { onSuccess: dialog.closeCreate },
    )
  }

  function handleUpdate(values: ReglaReordenFormValues) {
    if (!dialog.editing) return
    update.mutate(
      {
        id: dialog.editing.id,
        payload: {
          proveedor_id: values.proveedor_id as number,
          umbral_stock: values.umbral_stock,
          cantidad_pedido: values.cantidad_pedido,
          costo_unitario_estimado: values.costo_unitario_estimado,
        },
      },
      { onSuccess: dialog.closeEdit },
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reglas de reorden</h1>
          <p className="text-sm text-muted-foreground">
            Al llegar al umbral de stock, se sugiere automáticamente una orden de compra.
          </p>
        </div>
        <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nueva regla</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva regla de reorden</DialogTitle>
            </DialogHeader>
            <ReglaReordenForm
              isPending={create.isPending}
              errorMessage={create.isError ? getApiErrorMessage(create.error, 'No se pudo crear la regla') : undefined}
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
        <ReglasReordenTable
          reglas={reglas}
          onEdit={dialog.edit}
          onToggleEstado={(regla) => setEstado.mutate({ id: regla.id, activo: !regla.activo })}
        />
      </TableCard>

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar regla de reorden</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <ReglaReordenForm
              productoFijo={dialog.editing.producto.nombre}
              defaultValues={{
                producto_id: dialog.editing.producto_id,
                proveedor_id: dialog.editing.proveedor_id,
                umbral_stock: dialog.editing.umbral_stock,
                cantidad_pedido: dialog.editing.cantidad_pedido,
                costo_unitario_estimado: Number(dialog.editing.costo_unitario_estimado),
              }}
              isPending={update.isPending}
              errorMessage={update.isError ? getApiErrorMessage(update.error, 'No se pudo actualizar la regla') : undefined}
              onSubmit={handleUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
