import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AperturaCajaForm } from '@/features/caja/components/AperturaCajaForm'
import { CierreCajaForm } from '@/features/caja/components/CierreCajaForm'
import { MovimientoCajaForm } from '@/features/caja/components/MovimientoCajaForm'
import { MovimientosCajaTable } from '@/features/caja/components/MovimientosCajaTable'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useAbrirCaja, useCerrarCaja, useCrearMovimientoCaja } from '@/features/caja/hooks/useCajaMutations'
import { useCajaMovimientos, useCajaResumen } from '@/features/caja/hooks/useCajaResumen'
import type { AperturaFormValues, CierreFormValues, MovimientoCajaFormValues } from '@/features/caja/schemas/cajaSchema'

export function CajaPage() {
  const { data: caja, isLoading } = useCajaActual()
  const { data: resumen } = useCajaResumen(caja?.id)
  const { data: movimientos = [] } = useCajaMovimientos(caja?.id)
  const abrir = useAbrirCaja()
  const cerrar = useCerrarCaja()
  const crearMovimiento = useCrearMovimientoCaja()
  const [movimientoOpen, setMovimientoOpen] = useState(false)
  const [cierreOpen, setCierreOpen] = useState(false)

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Cargando...</p>
  }

  if (!caja) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 p-6">
        <h1 className="text-lg font-semibold">Abrir caja</h1>
        <AperturaCajaForm
          isPending={abrir.isPending}
          errorMessage={abrir.isError ? 'No se pudo abrir la caja' : undefined}
          onSubmit={(values: AperturaFormValues) => abrir.mutate(values.monto_inicial)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">Caja abierta desde {new Date(caja.fecha_apertura).toLocaleString()}</h1>
        <div className="flex gap-2">
          <Dialog open={movimientoOpen} onOpenChange={setMovimientoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Registrar movimiento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar movimiento de caja</DialogTitle>
              </DialogHeader>
              <MovimientoCajaForm
                isPending={crearMovimiento.isPending}
                errorMessage={crearMovimiento.isError ? 'No se pudo registrar el movimiento' : undefined}
                onSubmit={(values: MovimientoCajaFormValues) =>
                  crearMovimiento.mutate(
                    { ...values, motivo: values.motivo || null },
                    { onSuccess: () => setMovimientoOpen(false) },
                  )
                }
              />
            </DialogContent>
          </Dialog>

          <Dialog open={cierreOpen} onOpenChange={setCierreOpen}>
            <DialogTrigger asChild>
              <Button>Cerrar caja</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cerrar caja</DialogTitle>
              </DialogHeader>
              <CierreCajaForm
                resumen={resumen}
                isPending={cerrar.isPending}
                errorMessage={cerrar.isError ? 'No se pudo cerrar la caja' : undefined}
                onSubmit={(values: CierreFormValues) =>
                  cerrar.mutate(values.monto_final, { onSuccess: () => setCierreOpen(false) })
                }
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {resumen && (
        <div className="rounded-md border p-3 text-sm">
          <p>Monto inicial: ${resumen.caja.monto_inicial}</p>
          <p>Monto esperado ahora: ${resumen.monto_esperado}</p>
        </div>
      )}

      <MovimientosCajaTable movimientos={movimientos} />
    </div>
  )
}
