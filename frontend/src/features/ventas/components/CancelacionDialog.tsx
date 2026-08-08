import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCrearCancelacion } from '@/features/ventas/hooks/useCrearCancelacion'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency } from '@/lib/format'
import type { Venta } from '@/services/ventaService'

interface CancelacionDialogProps {
  venta: Venta | null
  onClose: () => void
}

// Siempre anula el ticket completo (nunca parcial, a diferencia de DevolucionDialog) — por eso
// sin tabla de líneas, solo el motivo. Ver docs/FRONTEND.md.
export function CancelacionDialog({ venta, onClose }: CancelacionDialogProps) {
  const [motivo, setMotivo] = useState('')
  const crear = useCrearCancelacion()

  function reset() {
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
    if (venta === null || motivo.trim() === '') return
    crear.mutate(
      { ventaId: venta.id, payload: { motivo: motivo.trim() } },
      {
        onSuccess: () => {
          reset()
          onClose()
        },
      },
    )
  }

  return (
    <Dialog open={venta !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar venta #{venta?.id}</DialogTitle>
        </DialogHeader>
        {venta && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Anula el ticket completo — el inventario regresa a su sucursal y, si fue en efectivo, el monto sale de
              tu caja actual. La venta deja de contar en cualquier reporte.
            </p>

            <div className="flex flex-col gap-2">
              <Label htmlFor="cancelacion-motivo">Motivo</Label>
              <Input
                id="cancelacion-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej. Se escaneó el producto equivocado"
              />
            </div>

            <div className="flex items-center justify-between rounded-md bg-destructive/5 p-3">
              <span className="text-sm text-muted-foreground">Monto a cancelar</span>
              <span className="text-lg font-bold tabular-nums text-destructive">{formatCurrency(venta.total)}</span>
            </div>

            {crear.isError && (
              <p role="alert" className="text-sm text-destructive">
                {getApiErrorMessage(crear.error, 'No se pudo cancelar la venta')}
              </p>
            )}

            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={crear.isPending || motivo.trim() === ''}
            >
              {crear.isPending ? 'Cancelando...' : 'Confirmar cancelación'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
