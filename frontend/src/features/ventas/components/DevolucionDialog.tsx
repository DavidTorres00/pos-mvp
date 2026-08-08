import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCrearDevolucion } from '@/features/ventas/hooks/useCrearDevolucion'
import { useDevoluciones } from '@/features/ventas/hooks/useDevoluciones'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency } from '@/lib/format'
import { numeroDesdeTexto, sanitizarNumeroNoNegativo } from '@/lib/numericInput'
import type { Venta } from '@/services/ventaService'

interface DevolucionDialogProps {
  venta: Venta | null
  onClose: () => void
}

// Reutilizado tanto por el kiosko del cajero (busca la venta por folio) como por el detalle de
// venta del admin (ya la tiene en mano) — ver docs/FRONTEND.md.
export function DevolucionDialog({ venta, onClose }: DevolucionDialogProps) {
  const [cantidades, setCantidades] = useState<Record<number, string>>({})
  const [motivo, setMotivo] = useState('')
  const { data: devoluciones } = useDevoluciones(venta?.id)
  const crear = useCrearDevolucion()

  const yaDevuelto = new Map<number, number>()
  for (const devolucion of devoluciones ?? []) {
    for (const item of devolucion.items) {
      yaDevuelto.set(item.detalle_venta_id, (yaDevuelto.get(item.detalle_venta_id) ?? 0) + item.cantidad)
    }
  }

  function reset() {
    setCantidades({})
    setMotivo('')
    crear.reset()
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset()
      onClose()
    }
  }

  function handleSubmit() {
    if (venta === null) return
    const items = Object.entries(cantidades)
      .map(([detalleVentaId, cantidadTexto]) => ({
        detalle_venta_id: Number(detalleVentaId),
        cantidad: numeroDesdeTexto(cantidadTexto),
      }))
      .filter((item) => Number.isFinite(item.cantidad) && item.cantidad > 0)
    if (items.length === 0 || motivo.trim() === '') return
    crear.mutate(
      { ventaId: venta.id, payload: { items, motivo: motivo.trim() } },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  const items = venta?.items ?? []
  const totalADevolver = items.reduce((suma, detalle) => {
    const cantidad = numeroDesdeTexto(cantidades[detalle.id] ?? '')
    return suma + (Number.isFinite(cantidad) ? cantidad * Number(detalle.precio_unitario) : 0)
  }, 0)
  const hayLineasSeleccionadas = items.some((detalle) => {
    const cantidad = numeroDesdeTexto(cantidades[detalle.id] ?? '')
    return Number.isFinite(cantidad) && cantidad > 0
  })

  return (
    <Dialog open={venta !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Devolución — venta #{venta?.id}</DialogTitle>
        </DialogHeader>
        {venta && (
          <div className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Vendido</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Devolver</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((detalle) => {
                  const disponible = detalle.cantidad - (yaDevuelto.get(detalle.id) ?? 0)
                  return (
                    <TableRow key={detalle.id}>
                      <TableCell className="font-medium">{detalle.producto.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">{detalle.cantidad}</TableCell>
                      <TableCell className="text-right tabular-nums">{disponible}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          value={cantidades[detalle.id] ?? ''}
                          onChange={(e) => {
                            const limpio = sanitizarNumeroNoNegativo(e.target.value)
                            const numero = numeroDesdeTexto(limpio)
                            if (!Number.isFinite(numero) || numero <= disponible) {
                              setCantidades((prev) => ({ ...prev, [detalle.id]: limpio }))
                            }
                          }}
                          disabled={disponible <= 0}
                          placeholder="0"
                          className="ml-auto h-8 w-16 text-right tabular-nums"
                          aria-label={`Cantidad a devolver de ${detalle.producto.nombre}`}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-2">
              <Label htmlFor="devolucion-motivo">Motivo</Label>
              <Input
                id="devolucion-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Cliente se equivocó de producto"
              />
            </div>

            <div className="flex items-center justify-between rounded-md bg-primary/5 p-3">
              <span className="text-sm text-muted-foreground">Total a devolver</span>
              <span className="text-lg font-bold tabular-nums text-primary">{formatCurrency(totalADevolver)}</span>
            </div>

            {crear.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getApiErrorMessage(crear.error, 'No se pudo procesar la devolución')}
              </p>
            )}

            <Button onClick={handleSubmit} disabled={crear.isPending || !hayLineasSeleccionadas || motivo.trim() === ''}>
              {crear.isPending ? 'Procesando...' : 'Confirmar devolución'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
