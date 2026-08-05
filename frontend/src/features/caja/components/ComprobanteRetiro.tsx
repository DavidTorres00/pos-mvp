import { formatCurrency, formatDateTime } from '@/lib/format'
import { montoEnLetras } from '@/lib/numeroALetras'
import type { VoucherRetiro } from '@/services/cajaService'

interface ComprobanteRetiroProps {
  voucher: VoucherRetiro
}

function codigoSeguimiento(voucher: VoucherRetiro): string {
  const fecha = new Date(voucher.fecha)
  const yyyymmdd = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`
  return `RT-${yyyymmdd}-${String(voucher.movimiento_id).padStart(4, '0')}`
}

// Contenido del comprobante físico: mismo componente en el modal chico del admin
// (UsuariosPage) y en la pantalla completa del cajero (VentaKiosco) — un solo lugar que sepa
// cómo se ve un comprobante de retiro, en vez de mantenerlo duplicado en dos formas distintas.
export function ComprobanteRetiro({ voucher }: ComprobanteRetiroProps) {
  return (
    <div id="voucher-print" className="flex flex-col gap-3 rounded-lg border bg-card p-5 text-sm">
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">MVP POS</p>
        <p className="mt-1 font-heading text-base font-semibold">Comprobante de retiro de efectivo</p>
        <p className="text-xs text-muted-foreground">
          Folio #{String(voucher.movimiento_id).padStart(4, '0')} · {formatDateTime(voucher.fecha)}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 border-t pt-3">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Cajero</span>
          <span className="font-medium">{voucher.cajero}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Sucursal</span>
          <span className="font-medium">{voucher.sucursal_nombre}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Equipo</span>
          <span className="font-medium">{voucher.equipo_nombre}</span>
        </p>
        {voucher.autorizado_por !== voucher.cajero && (
          <p className="flex justify-between">
            <span className="text-muted-foreground">Autorizó</span>
            <span className="font-medium">{voucher.autorizado_por}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 border-t pt-3 tabular-nums">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Efectivo antes del retiro</span>
          {formatCurrency(voucher.efectivo_anterior)}
        </p>

        <div className="py-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Monto retirado</p>
          <p className="text-3xl font-bold text-primary">{formatCurrency(voucher.monto_retirado)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground uppercase">{montoEnLetras(voucher.monto_retirado)}</p>
        </div>

        <p className="flex justify-between border-t pt-1.5">
          <span className="text-muted-foreground">Efectivo en caja tras el retiro</span>
          {formatCurrency(voucher.efectivo_resultante)}
        </p>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-6 border-t pt-6 text-xs">
        <div className="border-t pt-1 text-center text-muted-foreground uppercase">Entrega · Cajero</div>
        <div className="border-t pt-1 text-center text-muted-foreground uppercase">Recibe · Bóveda</div>
      </div>

      <p className="border-t pt-2 text-center text-xs text-muted-foreground">
        Conserva este comprobante junto con el efectivo retirado. Documento sin validez fiscal.
      </p>
      <p className="text-center text-[10px] text-muted-foreground/60">{codigoSeguimiento(voucher)}</p>
    </div>
  )
}
