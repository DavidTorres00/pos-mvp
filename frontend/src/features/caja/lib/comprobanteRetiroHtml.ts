import { formatCurrency, formatDateTime } from '@/lib/format'
import { montoEnLetras } from '@/lib/numeroALetras'
import { ESTILOS_TICKET_BASE, escaparHtml } from '@/lib/ticketHtml'
import type { VoucherRetiro } from '@/services/cajaService'

function codigoSeguimiento(voucher: VoucherRetiro): string {
  const fecha = new Date(voucher.fecha)
  const yyyymmdd = `${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}`
  return `RT-${yyyymmdd}-${String(voucher.movimiento_id).padStart(4, '0')}`
}

// HTML del comprobante de retiro para la impresora térmica (ver src/lib/qzPrint.ts): se
// imprime directo al validarse el retiro, sin pantalla dedicada ni botón — autocontenido, sin
// depender del bundle de la app porque QZ Tray lo renderiza en su propio motor headless.
export function construirComprobanteRetiroHtml(voucher: VoucherRetiro): string {
  const autorizacion =
    voucher.autorizado_por !== voucher.cajero
      ? `<tr><td>Autorizó</td><td class="num">${escaparHtml(voucher.autorizado_por)}</td></tr>`
      : ''

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${ESTILOS_TICKET_BASE}
  .monto { font-size: 20px; }
  .firmas { width: 100%; }
  .firmas td { border-top: 1px solid #000; padding-top: 2px; font-size: 10px; text-align: center; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="center bold">${escaparHtml(voucher.sucursal_nombre)}</div>
  ${voucher.sucursal_direccion ? `<div class="center muted" style="font-size: 10px;">${escaparHtml(voucher.sucursal_direccion)}</div>` : ''}
  <div class="center">Comprobante de retiro de efectivo</div>
  <div class="center muted">
    Folio #${String(voucher.movimiento_id).padStart(4, '0')} &middot; ${formatDateTime(voucher.fecha)}
  </div>
  <hr />
  <table>
    <tr><td>Cajero</td><td class="num">${escaparHtml(voucher.cajero)}</td></tr>
    <tr><td>Equipo</td><td class="num">${escaparHtml(voucher.equipo_nombre)}</td></tr>
    ${autorizacion}
  </table>
  <hr />
  <table>
    <tr><td>Efectivo antes del retiro</td><td class="num">${formatCurrency(voucher.efectivo_anterior)}</td></tr>
  </table>
  <div style="margin: 6px 0;">
    <div class="muted" style="font-size: 10px; text-transform: uppercase;">Monto retirado</div>
    <div class="monto bold">${formatCurrency(voucher.monto_retirado)}</div>
    <div class="muted" style="font-size: 10px; text-transform: uppercase;">${montoEnLetras(voucher.monto_retirado)}</div>
  </div>
  <table>
    <tr><td>Efectivo en caja tras el retiro</td><td class="num">${formatCurrency(voucher.efectivo_resultante)}</td></tr>
  </table>
  <table class="firmas" style="margin-top: 32px;">
    <tr>
      <td>Entrega &middot; ${escaparHtml(voucher.cajero)}</td>
    </tr>
  </table>
  <hr style="margin-top: 18px;" />
  <div class="center muted" style="font-size: 10px;">
    Conserva este comprobante junto con el efectivo retirado. Documento sin validez fiscal.
  </div>
  <div class="center muted" style="font-size: 9px;">${codigoSeguimiento(voucher)}</div>
</body>
</html>`
}
