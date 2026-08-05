import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SucursalActivaSelector } from '@/components/SucursalActivaSelector'
import { TableCard } from '@/components/TableCard'
import { CompraForm } from '@/features/compras/components/CompraForm'
import { ComprasTable } from '@/features/compras/components/ComprasTable'
import { useCompras } from '@/features/compras/hooks/useCompras'
import { useCrearCompra } from '@/features/compras/hooks/useCrearCompra'
import type { CompraFormValues } from '@/features/compras/schemas/compraSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Compra } from '@/services/compraService'
import { useAuthStore } from '@/stores/authStore'

export function ComprasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detalle, setDetalle] = useState<Compra | null>(null)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const { page, size, setPage } = usePagination(10)
  const { data, isLoading, isError } = useCompras(page, size, isAdmin)
  const compras = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const crear = useCrearCompra()

  function handleCreate(values: CompraFormValues) {
    if (crear.isPending) return
    const payload = {
      proveedor_id: values.proveedor_id as number,
      items: values.items.map((item) => ({ ...item, producto_id: item.producto_id as number })),
    }
    crear.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Compras</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Compras</h1>
        <div className="flex items-center gap-3">
          <SucursalActivaSelector />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Nueva compra</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
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
      </div>

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <ComprasTable compras={compras} onVerDetalle={setDetalle} />
      </TableCard>

      <Dialog open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de compra</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="flex flex-col gap-2 text-sm">
              <p>Proveedor: {detalle.proveedor.nombre}</p>
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
