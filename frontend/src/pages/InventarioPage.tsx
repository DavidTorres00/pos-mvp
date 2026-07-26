import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'
import { MovimientoForm } from '@/features/inventario/components/MovimientoForm'
import { MovimientosTable } from '@/features/inventario/components/MovimientosTable'
import { useCrearMovimiento } from '@/features/inventario/hooks/useCrearMovimiento'
import { useMovimientos } from '@/features/inventario/hooks/useMovimientos'
import type { MovimientoFormValues } from '@/features/inventario/schemas/movimientoSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { usePagination } from '@/lib/hooks/usePagination'

export function InventarioPage() {
  const [open, setOpen] = useState(false)
  const { data: movimientos = [], isLoading, isError } = useMovimientos()
  const { pageItems, page, pageCount, setPage, total } = usePagination(movimientos, 10)
  const crear = useCrearMovimiento()

  function handleSubmit(values: MovimientoFormValues) {
    crear.mutate({ ...values, motivo: values.motivo || null }, { onSuccess: () => setOpen(false) })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Registrar movimiento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar movimiento</DialogTitle>
            </DialogHeader>
            <MovimientoForm
              isPending={crear.isPending}
              errorMessage={
                crear.isError ? getApiErrorMessage(crear.error, 'No se pudo registrar el movimiento') : undefined
              }
              onSubmit={handleSubmit}
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
          <MovimientosTable movimientos={pageItems} />
          <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
