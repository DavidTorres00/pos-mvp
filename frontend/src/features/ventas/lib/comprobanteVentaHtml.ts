import { FORMA_PAGO_LABELS, type Venta } from '@/services/ventaService'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { ESTILOS_TICKET_BASE, escaparHtml } from '@/lib/ticketHtml'

interface DatosComprobanteVenta {
  venta: Venta
  cajero: string
  sucursal: string
  direccion?: string | null
  equipo: string
  // solo aplica a efectivo — el resto de las formas de pago no maneja cambio físico
  pagoCon?: number
  cambio?: number
}

// HTML de la nota de venta para la impresora térmica (ver src/lib/qzPrint.ts): autocontenido,
// sin depender del bundle de la app (Tailwind, variables oklch) porque QZ Tray lo renderiza en
// su propio motor headless, sin acceso a la hoja de estilos de la página.
export function construirComprobanteVentaHtml({
  venta,
  cajero,
  sucursal,
  direccion,
  equipo,
  pagoCon,
  cambio,
}: DatosComprobanteVenta): string {
  const filas = venta.items
    .map(
      (item) => `
        <tr>
          <td>${escaparHtml(item.producto.nombre)} &times; ${item.cantidad}</td>
          <td class="num">${formatCurrency(item.subtotal)}</td>
        </tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${ESTILOS_TICKET_BASE}
  .total td { font-size: 15px; }
</style>
</head>
<body>
  <div class="center bold">${escaparHtml(sucursal)}</div>
  ${direccion ? `<div class="center muted" style="font-size: 10px;">${escaparHtml(direccion)}</div>` : ''}
  <div class="center">Nota de venta</div>
  <div class="center muted">Folio #${String(venta.id).padStart(4, '0')} &middot; ${formatDateTime(venta.created_at)}</div>
  <hr />
  <table>
    <tr><td>Equipo</td><td class="num">${escaparHtml(equipo)}</td></tr>
    <tr><td>Cajero</td><td class="num">${escaparHtml(cajero)}</td></tr>
  </table>
  <hr />
  <table>${filas}</table>
  <hr />
  <table>
    <tr class="total bold"><td>Total</td><td class="num">${formatCurrency(venta.total)}</td></tr>
    <tr><td>Forma de pago</td><td class="num">${FORMA_PAGO_LABELS[venta.forma_pago]}</td></tr>
    ${pagoCon !== undefined ? `<tr><td>Pagó con</td><td class="num">${formatCurrency(pagoCon)}</td></tr>` : ''}
    ${cambio !== undefined && cambio > 0 ? `<tr><td>Cambio</td><td class="num">${formatCurrency(cambio)}</td></tr>` : ''}
  </table>
  <hr style="margin-top: 18px;" />
  <div class="center">Gracias por su compra.</div>
  <div class="center muted" style="font-size: 10px;">Documento sin validez fiscal.</div>
</body>
</html>`
}
