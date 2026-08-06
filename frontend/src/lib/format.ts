// Asunción: locale/moneda no están definidos en ningún lado del proyecto (backend, README, .env).
// Se usa es-MX/MXN como default razonable para LatAm — cambiar aquí si el negocio opera en otra plaza.
const LOCALE = 'es-MX'
const CURRENCY = 'MXN'

const currencyFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })
const weekdayDateFormatter = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' })
const timeFormatter = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false })
const relativeTimeFormatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'always', style: 'short' })

const UNIDADES_RELATIVAS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

export function formatCurrency(value: number | string): string {
  return currencyFormatter.format(typeof value === 'string' ? Number(value) : value)
}

export function formatDate(value: string | number | Date): string {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string | number | Date): string {
  return dateTimeFormatter.format(new Date(value))
}

export function formatWeekdayDate(value: string | number | Date): string {
  return weekdayDateFormatter.format(new Date(value))
}

export function formatTime(value: string | number | Date): string {
  return timeFormatter.format(new Date(value))
}

export function formatHaceTiempo(value: string | number | Date): string {
  const diffSegundos = (new Date(value).getTime() - Date.now()) / 1000
  if (Math.abs(diffSegundos) < 60) return 'justo ahora'
  for (const [unidad, segundosPorUnidad] of UNIDADES_RELATIVAS) {
    if (Math.abs(diffSegundos) >= segundosPorUnidad) {
      return relativeTimeFormatter.format(Math.round(diffSegundos / segundosPorUnidad), unidad)
    }
  }
  return relativeTimeFormatter.format(Math.round(diffSegundos / 60), 'minute')
}
