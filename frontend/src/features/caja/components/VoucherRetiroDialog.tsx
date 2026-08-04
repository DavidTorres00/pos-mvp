import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency, formatDateTime } from '@/lib/format'
import type { VoucherRetiro } from '@/services/cajaService'

interface VoucherRetiroDialogProps {
  voucher: VoucherRetiro | null
  onClose: () => void
}

export function VoucherRetiroDialog({ voucher, onClose }: VoucherRetiroDialogProps) {
  return (
    <Dialog open={voucher !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retiro de excedente registrado</DialogTitle>
        </DialogHeader>

        {voucher && (
          <div id="voucher-print" className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-sm">
            <p className="text-center font-heading text-base font-semibold">Comprobante de retiro de efectivo</p>
            <p className="text-center text-xs text-muted-foreground">Folio #{voucher.movimiento_id}</p>
            <div className="mt-2 flex flex-col gap-1.5 border-t pt-2 tabular-nums">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span> {formatDateTime(voucher.fecha)}
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Cajero</span> {voucher.cajero}
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Caja</span> #{voucher.caja_id}
              </p>
              <p className="flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground">Efectivo antes del retiro</span>
                {formatCurrency(voucher.efectivo_anterior)}
              </p>
              <p className="flex justify-between text-base font-semibold text-primary">
                <span className="font-medium text-foreground">Monto retirado</span>
                {formatCurrency(voucher.monto_retirado)}
              </p>
              <p className="flex justify-between border-t pt-1.5">
                <span className="text-muted-foreground">Efectivo en caja tras el retiro</span>
                {formatCurrency(voucher.efectivo_resultante)}
              </p>
            </div>
            <p className="mt-2 border-t pt-2 text-center text-xs text-muted-foreground">
              Guardar este comprobante junto con el efectivo retirado.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={() => window.print()}>Imprimir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
