import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { VentaForm } from '@/features/ventas/components/VentaForm'
import { VentasTable } from '@/features/ventas/components/VentasTable'
import { useCrearVenta } from '@/features/ventas/hooks/useCrearVenta'
import { useVentas } from '@/features/ventas/hooks/useVentas'
import type { VentaFormValues } from '@/features/ventas/schemas/ventaSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Venta } from '@/services/ventaService'

export function VentasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detalle, setDetalle] = useState<Venta | null>(null)

  const { data: caja, isLoading: isLoadingCaja } = useCajaActual()
  const { page, size, setPage } = usePagination(10)
  const { data, isLoading, isError } = useVentas(page, size)
  const ventas = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const crear = useCrearVenta()

  function handleCreate(values: VentaFormValues) {
    if (crear.isPending) return
    const payload = {
      items: values.items.map((item) => ({ producto_id: item.producto_id as number, cantidad: item.cantidad })),
      forma_pago: values.forma_pago,
    }
    crear.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Ventas</h1>
        {!isLoadingCaja && caja ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Nueva venta</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Nueva venta</DialogTitle>
              </DialogHeader>
              <VentaForm
                isPending={crear.isPending}
                errorMessage={
                  crear.isError ? getApiErrorMessage(crear.error, 'No se pudo registrar la venta') : undefined
                }
                onSubmit={handleCreate}
              />
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {!isLoadingCaja && !caja && (
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          No hay caja abierta.{' '}
          <Link to="/caja" className="underline">
            Abre caja
          </Link>{' '}
          para poder vender.
        </p>
      )}

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <VentasTable ventas={ventas} onVerDetalle={setDetalle} />
      </TableCard>

      <Dialog open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de venta</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="flex flex-col gap-2 text-sm">
              <p>Fecha: {formatDateTime(detalle.created_at)}</p>
              <p>
                Forma de pago:{' '}
                {{ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' }[detalle.forma_pago]}
              </p>
              <ul className="flex flex-col gap-1">
                {detalle.items.map((item) => (
                  <li key={item.id}>
                    {item.producto.nombre} — {item.cantidad} x {formatCurrency(item.precio_unitario)} ={' '}
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
