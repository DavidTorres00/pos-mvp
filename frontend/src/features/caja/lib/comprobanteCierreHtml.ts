import { formatCurrency, formatDateTime } from '@/lib/format'
import { ESTILOS_TICKET_BASE, escaparHtml } from '@/lib/ticketHtml'
import type { CajaResumen } from '@/services/cajaService'

// HTML del corte de caja para la impresora térmica (ver src/lib/qzPrint.ts): se imprime directo
// al validarse el cierre, sin pantalla ni botón dedicado — el efectivo final tiene que quedar
// asentado en papel igual que un retiro de excedente, exceda o no el límite de la sucursal.
export function construirComprobanteCierreHtml(resumen: CajaResumen): string {
  const { caja } = resumen
  const diferencia = Number(resumen.diferencia ?? 0)
  const resultado =
    diferencia === 0
      ? 'La caja cuadra exacto.'
      : diferencia > 0
        ? `Sobraron ${formatCurrency(Math.abs(diferencia))} respecto a lo esperado.`
        : `Faltaron ${formatCurrency(Math.abs(diferencia))} respecto a lo esperado.`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${ESTILOS_TICKET_BASE}
  .resultado { font-weight: bold; text-align: center; margin: 8px 0; }
  .firmas { width: 100%; }
  .firmas td { border-top: 1px solid #000; padding-top: 2px; font-size: 10px; text-align: center; text-transform: uppercase; }
</style>
</head>
<body>
  <div class="center bold">${escaparHtml(caja.sucursal_nombre)}</div>
  ${caja.sucursal_direccion ? `<div class="center muted" style="font-size: 10px;">${escaparHtml(caja.sucursal_direccion)}</div>` : ''}
  <div class="center">Corte de caja</div>
  <div class="center muted">
    Folio #${String(caja.id).padStart(4, '0')} &middot; ${caja.fecha_cierre ? formatDateTime(caja.fecha_cierre) : ''}
  </div>
  <hr />
  <table>
    <tr><td>Cajero</td><td class="num">${escaparHtml(caja.usuario_nombre)}</td></tr>
    <tr><td>Equipo</td><td class="num">${escaparHtml(caja.equipo_nombre)}</td></tr>
    <tr><td>Apertura</td><td class="num">${formatDateTime(caja.fecha_apertura)}</td></tr>
  </table>
  <hr />
  <table>
    <tr><td>Monto inicial</td><td class="num">${formatCurrency(caja.monto_inicial)}</td></tr>
    <tr><td>Ventas en efectivo</td><td class="num">${formatCurrency(resumen.total_ventas_efectivo)}</td></tr>
    <tr><td>Ventas con tarjeta</td><td class="num">${formatCurrency(resumen.total_ventas_tarjeta)}</td></tr>
    <tr><td>Ventas por transferencia</td><td class="num">${formatCurrency(resumen.total_ventas_transferencia)}</td></tr>
    <tr><td>Otras entradas</td><td class="num">${formatCurrency(resumen.total_entradas)}</td></tr>
    <tr><td>Otras salidas</td><td class="num">${formatCurrency(resumen.total_salidas)}</td></tr>
  </table>
  <hr />
  <table>
    <tr class="total bold"><td>Monto esperado</td><td class="num">${formatCurrency(resumen.monto_esperado)}</td></tr>
    <tr class="total bold"><td>Monto final contado</td><td class="num">${formatCurrency(caja.monto_final ?? '0')}</td></tr>
  </table>
  <div class="resultado">${resultado}</div>
  <table class="firmas" style="margin-top: 32px;">
    <tr><td>Entrega &middot; ${escaparHtml(caja.usuario_nombre)}</td></tr>
  </table>
  <hr style="margin-top: 18px;" />
  <div class="center muted" style="font-size: 10px;">Documento sin validez fiscal.</div>
</body>
</html>`
}
