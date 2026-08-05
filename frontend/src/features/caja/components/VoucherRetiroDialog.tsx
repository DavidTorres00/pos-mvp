import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ComprobanteRetiro } from '@/features/caja/components/ComprobanteRetiro'
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

        {voucher && <ComprobanteRetiro voucher={voucher} />}

        <DialogFooter>
          <Button onClick={() => window.print()}>Imprimir comprobante</Button>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
