// Compartido entre los generadores de comprobantes térmicos (nota de venta, comprobante de
// retiro — ver features/ventas/lib/comprobanteVentaHtml.ts y features/caja/lib/comprobanteRetiroHtml.ts).
export function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"']/g, (caracter) => {
    switch (caracter) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

// Reglas base de todo ticket térmico. 260px, no 280px: el área imprimible real de un rollo de
// 80mm es más angosta que el ancho nominal del papel — con 280px se comía el último dígito de
// cada precio a la derecha. Cada comprobante agrega sus propias reglas encima de estas.
export const ESTILOS_TICKET_BASE = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: 260px; font-family: 'Courier New', monospace; font-size: 12px; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .muted { color: #444; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 2px 0; vertical-align: top; }
  td.num { text-align: right; white-space: nowrap; }
`
