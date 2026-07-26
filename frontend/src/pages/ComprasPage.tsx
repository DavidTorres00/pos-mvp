import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'
import { CompraForm } from '@/features/compras/components/CompraForm'
import { ComprasTable } from '@/features/compras/components/ComprasTable'
import { useCompras } from '@/features/compras/hooks/useCompras'
import { useCrearCompra } from '@/features/compras/hooks/useCrearCompra'
import type { CompraFormValues } from '@/features/compras/schemas/compraSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Compra } from '@/services/compraService'

export function ComprasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detalle, setDetalle] = useState<Compra | null>(null)

  const { data: compras = [], isLoading, isError } = useCompras()
  const { pageItems, page, pageCount, setPage, total } = usePagination(compras, 10)
  const crear = useCrearCompra()

  function handleCreate(values: CompraFormValues) {
    if (crear.isPending) return
    const payload = {
      proveedor: values.proveedor,
      items: values.items.map((item) => ({ ...item, producto_id: item.producto_id as number })),
    }
    crear.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Compras</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nueva compra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva compra</DialogTitle>
            </DialogHeader>
            <CompraForm
              isPending={crear.isPending}
              errorMessage={
                crear.isError ? getApiErrorMessage(crear.error, 'No se pudo registrar la compra') : undefined
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
          <ComprasTable compras={pageItems} onVerDetalle={setDetalle} />
          <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        </>
      )}

      <Dialog open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de compra</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="flex flex-col gap-2 text-sm">
              <p>Proveedor: {detalle.proveedor}</p>
              <p>Fecha: {formatDateTime(detalle.created_at)}</p>
              <ul className="flex flex-col gap-1">
                {detalle.items.map((item) => (
                  <li key={item.id}>
                    {item.producto.nombre} — {item.cantidad} x {formatCurrency(item.costo_unitario)} ={' '}
                    {formatCurrency(item.subtotal)}
                  </li>
                ))}
              </ul>
              <p className="border-t pt-2 text-base font-semibold tabular-nums text-foreground">
                Total: <span className="text-primary">{formatCurrency(detalle.total)}</span>
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
