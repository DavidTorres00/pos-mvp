const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const DIEZ_A_DIECINUEVE = [
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciseis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
]
const VEINTE_A_VEINTINUEVE = [
  'veinte',
  'veintiuno',
  'veintidos',
  'veintitres',
  'veinticuatro',
  'veinticinco',
  'veintiseis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
]
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = [
  '',
  'ciento',
  'doscientos',
  'trescientos',
  'cuatrocientos',
  'quinientos',
  'seiscientos',
  'setecientos',
  'ochocientos',
  'novecientos',
]

// convierte 0-999 a palabras, sin el sufijo "mil"/"millones" (eso lo agrega convertirEntero)
function convertirGrupo(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cien'

  const partes: string[] = []
  const centena = Math.floor(n / 100)
  const resto = n % 100

  if (centena > 0) partes.push(CENTENAS[centena])

  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto])
    else if (resto < 20) partes.push(DIEZ_A_DIECINUEVE[resto - 10])
    else if (resto < 30) partes.push(VEINTE_A_VEINTINUEVE[resto - 20])
    else {
      const decena = Math.floor(resto / 10)
      const unidad = resto % 10
      partes.push(unidad > 0 ? `${DECENAS[decena]} y ${UNIDADES[unidad]}` : DECENAS[decena])
    }
  }

  return partes.join(' ')
}

function convertirEntero(n: number): string {
  if (n === 0) return 'cero'
  if (n < 1000) return convertirGrupo(n)

  const millones = Math.floor(n / 1_000_000)
  const restoMillones = n % 1_000_000
  const miles = Math.floor(restoMillones / 1000)
  const centenas = restoMillones % 1000

  const partes: string[] = []
  if (millones > 0) partes.push(millones === 1 ? 'un millon' : `${convertirEntero(millones)} millones`)
  if (miles > 0) partes.push(miles === 1 ? 'mil' : `${convertirGrupo(miles)} mil`)
  if (centenas > 0) partes.push(convertirGrupo(centenas))

  return partes.join(' ')
}

// "MIL NOVECIENTOS PESOS 00/100 M.N." — formato tipo cheque, para el comprobante impreso que se
// guarda junto con el efectivo retirado (documento físico, conviene que el monto no dependa
// solo de los dígitos). Sin acentos en las palabras: así se escriben en mayúsculas en los
// documentos bancarios de referencia que se usaron para este formato.
export function montoEnLetras(value: number | string): string {
  const num = Math.abs(typeof value === 'string' ? Number(value) : value)
  const entero = Math.trunc(num)
  const centavos = Math.round((num - entero) * 100)
  const sustantivo = entero === 1 ? 'PESO' : 'PESOS'
  return `${convertirEntero(entero).toUpperCase()} ${sustantivo} ${String(centavos).padStart(2, '0')}/100 M.N.`
}
