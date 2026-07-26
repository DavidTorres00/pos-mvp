import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { VentaForm } from '@/features/ventas/components/VentaForm'
import { VentasTable } from '@/features/ventas/components/VentasTable'
import { useCrearVenta } from '@/features/ventas/hooks/useCrearVenta'
import { useVentas } from '@/features/ventas/hooks/useVentas'
import type { VentaFormValues } from '@/features/ventas/schemas/ventaSchema'
import type { Venta } from '@/services/ventaService'

export function VentasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detalle, setDetalle] = useState<Venta | null>(null)

  const { data: caja, isLoading: isLoadingCaja } = useCajaActual()
  const { data: ventas = [], isLoading } = useVentas()
  const crear = useCrearVenta()

  function handleCreate(values: VentaFormValues) {
    const payload = {
      items: values.items.map((item) => ({ producto_id: item.producto_id as number, cantidad: item.cantidad })),
    }
    crear.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Ventas</h1>
        {!isLoadingCaja && caja ? (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>Nueva venta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva venta</DialogTitle>
              </DialogHeader>
              <VentaForm
                isPending={crear.isPending}
                errorMessage={crear.isError ? 'No se pudo registrar la venta' : undefined}
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <VentasTable ventas={ventas} onVerDetalle={setDetalle} />
      )}

      <Dialog open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de venta</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="flex flex-col gap-2 text-sm">
              <p>Fecha: {new Date(detalle.created_at).toLocaleString()}</p>
              <ul className="flex flex-col gap-1">
                {detalle.items.map((item) => (
                  <li key={item.id}>
                    {item.producto.nombre} — {item.cantidad} x ${item.precio_unitario} = ${item.subtotal}
                  </li>
                ))}
              </ul>
              <p className="font-semibold">Total: ${detalle.total}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
