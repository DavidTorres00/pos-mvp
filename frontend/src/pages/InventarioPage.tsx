import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MovimientoForm } from '@/features/inventario/components/MovimientoForm'
import { MovimientosTable } from '@/features/inventario/components/MovimientosTable'
import { useCrearMovimiento } from '@/features/inventario/hooks/useCrearMovimiento'
import { useMovimientos } from '@/features/inventario/hooks/useMovimientos'
import type { MovimientoFormValues } from '@/features/inventario/schemas/movimientoSchema'

export function InventarioPage() {
  const [open, setOpen] = useState(false)
  const { data: movimientos = [], isLoading } = useMovimientos()
  const crear = useCrearMovimiento()

  function handleSubmit(values: MovimientoFormValues) {
    crear.mutate(
      { ...values, motivo: values.motivo || null },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Inventario</h1>
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
              errorMessage={crear.isError ? 'No se pudo registrar el movimiento' : undefined}
              onSubmit={handleSubmit}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <MovimientosTable movimientos={movimientos} />
      )}
    </div>
  )
}
