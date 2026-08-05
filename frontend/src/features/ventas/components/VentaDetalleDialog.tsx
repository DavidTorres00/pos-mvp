import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { FORMA_PAGO_LABELS, type Venta } from '@/services/ventaService'

interface VentaDetalleDialogProps {
  venta: Venta | null
  onClose: () => void
}

export function VentaDetalleDialog({ venta, onClose }: VentaDetalleDialogProps) {
  return (
    <Dialog open={venta !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalle de venta</DialogTitle>
        </DialogHeader>
        {venta && (
          <div className="flex flex-col gap-2 text-sm">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
