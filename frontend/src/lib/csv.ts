// BOM (`﻿`) al frente: para que Excel abra el archivo con acentos correctos en vez de
// interpretarlo como Latin-1 — mismo criterio en las 4 exportaciones del hub de Ventas.
export function filasACsv(encabezado: string[], filas: (string | number)[][], notaFinal?: string): string {
  const lineas = [encabezado, ...filas].map((fila) =>
    fila.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(','),
  )
  if (notaFinal) {
    lineas.push(`"${notaFinal.replaceAll('"', '""')}"`)
  }
  return `﻿${lineas.join('\n')}`
}

export function descargarCsv(csv: string, nombreArchivo: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  enlace.click()
  URL.revokeObjectURL(url)
}
