import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CompraForm } from '@/features/compras/components/CompraForm'
import { ComprasTable } from '@/features/compras/components/ComprasTable'
import { useCompras } from '@/features/compras/hooks/useCompras'
import { useCrearCompra } from '@/features/compras/hooks/useCrearCompra'
import type { CompraFormValues } from '@/features/compras/schemas/compraSchema'
import type { Compra } from '@/services/compraService'

export function ComprasPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [detalle, setDetalle] = useState<Compra | null>(null)

  const { data: compras = [], isLoading } = useCompras()
  const crear = useCrearCompra()

  function handleCreate(values: CompraFormValues) {
    const payload = {
      proveedor: values.proveedor,
      items: values.items.map((item) => ({ ...item, producto_id: item.producto_id as number })),
    }
    crear.mutate(payload, { onSuccess: () => setCreateOpen(false) })
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Compras</h1>
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
              errorMessage={crear.isError ? 'No se pudo registrar la compra' : undefined}
              onSubmit={handleCreate}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <ComprasTable compras={compras} onVerDetalle={setDetalle} />
      )}

      <Dialog open={detalle !== null} onOpenChange={(open) => !open && setDetalle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle de compra</DialogTitle>
          </DialogHeader>
          {detalle && (
            <div className="flex flex-col gap-2 text-sm">
              <p>Proveedor: {detalle.proveedor}</p>
              <p>Fecha: {new Date(detalle.created_at).toLocaleString()}</p>
              <ul className="flex flex-col gap-1">
                {detalle.items.map((item) => (
                  <li key={item.id}>
                    {item.producto.nombre} — {item.cantidad} x ${item.costo_unitario} = ${item.subtotal}
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
