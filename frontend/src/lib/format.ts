// Asunción: locale/moneda no están definidos en ningún lado del proyecto (backend, README, .env).
// Se usa es-MX/MXN como default razonable para LatAm — cambiar aquí si el negocio opera en otra plaza.
const LOCALE = 'es-MX'
const CURRENCY = 'MXN'

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })

export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(typeof value === 'string' ? Number(value) : value)
}

export function formatDate(value: string | number | Date): string {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string | number | Date): string {
  return dateTimeFormatter.format(new Date(value))
}
