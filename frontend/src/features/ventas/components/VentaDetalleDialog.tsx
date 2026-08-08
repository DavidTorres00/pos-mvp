import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CancelacionDialog } from '@/features/ventas/components/CancelacionDialog'
import { DevolucionDialog } from '@/features/ventas/components/DevolucionDialog'
import { useCancelacion } from '@/features/ventas/hooks/useCancelacion'
import { useDevoluciones } from '@/features/ventas/hooks/useDevoluciones'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { FORMA_PAGO_LABELS, type Venta } from '@/services/ventaService'

interface VentaDetalleDialogProps {
  venta: Venta | null
  onClose: () => void
}

export function VentaDetalleDialog({ venta, onClose }: VentaDetalleDialogProps) {
  const [ventaADevolver, setVentaADevolver] = useState<Venta | null>(null)
  const [ventaACancelar, setVentaACancelar] = useState<Venta | null>(null)
  const cancelada = venta?.estado === 'cancelada'
  const { data: devoluciones } = useDevoluciones(venta?.id)
  const { data: cancelacion } = useCancelacion(venta?.id, cancelada)
  // cancelar y devolver son mutuamente excluyentes (ver docs/BACKEND.md): con una devolución ya
  // procesada, el backend rechazaría la cancelación de todos modos — el botón se oculta antes de
  // dejar que el admin llegue a ese error
  const tieneDevolucion = (devoluciones?.length ?? 0) > 0

  // cierra este detalle antes de abrir el diálogo de devolución/cancelación (evita dos modales
  // superpuestos); toma su propia copia de la venta porque `onClose` limpia la del padre
  function handleDevolver() {
    if (venta === null) return
    setVentaADevolver(venta)
    onClose()
  }

  function handleCancelar() {
    if (venta === null) return
    setVentaACancelar(venta)
    onClose()
  }

  return (
    <>
      <Dialog open={venta !== null} onOpenChange={(open) => !open && onClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Detalle de venta
              {cancelada && <Badge variant="destructive">Cancelada</Badge>}
            </DialogTitle>
          </DialogHeader>
          {venta && (
            <div className="flex flex-col gap-3 text-sm">
              <p>Fecha: {formatDateTime(venta.created_at)}</p>
              <p>Forma de pago: {FORMA_PAGO_LABELS[venta.forma_pago]}</p>
              <ul className="flex flex-col gap-1">
                {venta.items.map((item) => (
                  <li key={item.id}>
                    {item.producto.nombre} — {item.cantidad} x {formatCurrency(item.precio_unitario)} ={' '}
                    {formatCurrency(item.subtotal)}
                  </li>
                ))}
              </ul>
              <p className="border-t pt-2 text-base font-semibold tabular-nums text-foreground">
                Total: <span className="text-primary">{formatCurrency(venta.total)}</span>
              </p>

              {cancelada && cancelacion && (
                <div className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
                  <p className="flex justify-between font-medium">
                    <span>
                      {formatDateTime(cancelacion.created_at)} · {cancelacion.actor_nombre}
                    </span>
                  </p>
                  <p className="text-muted-foreground">{cancelacion.motivo}</p>
                </div>
              )}

              {devoluciones && devoluciones.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t pt-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Devoluciones
                  </p>
                  {devoluciones.map((devolucion) => (
                    <div key={devolucion.id} className="rounded-md border p-2 text-xs">
                      <p className="flex justify-between font-medium">
                        <span>
                          {formatDateTime(devolucion.created_at)} · {devolucion.actor_nombre}
                        </span>
                        <span className="tabular-nums text-destructive">
                          -{formatCurrency(devolucion.monto_total)}
                        </span>
                      </p>
                      <p className="text-muted-foreground">{devolucion.motivo}</p>
                    </div>
                  ))}
                </div>
              )}

              {!cancelada && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDevolver}>
                    Devolver
                  </Button>
                  {!tieneDevolucion && (
                    <Button variant="destructive" size="sm" onClick={handleCancelar}>
                      Cancelar venta
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DevolucionDialog venta={ventaADevolver} onClose={() => setVentaADevolver(null)} />
      <CancelacionDialog venta={ventaACancelar} onClose={() => setVentaACancelar(null)} />
    </>
  )
}
