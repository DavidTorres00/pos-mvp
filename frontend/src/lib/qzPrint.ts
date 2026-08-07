import qz from 'qz-tray'

// Sin certificado firmado (no se distribuye esta app a terceros, corre en equipos propios):
// QZ Tray pide un permiso único por sitio la primera vez que conecta, en vez de validar una
// firma criptográfica real. Sin este par de promesas, qz.websocket.connect() intenta bajar un
// certificado de demo del propio QZ por internet y falla si el equipo no tiene salida a la red.
qz.security.setCertificatePromise((resolve) => resolve())
qz.security.setSignaturePromise(() => (resolve) => resolve())

let conexion: Promise<void> | null = null

async function asegurarConexion(): Promise<void> {
  if (qz.websocket.isActive()) return
  conexion ??= qz.websocket.connect().catch((error: unknown) => {
    conexion = null
    throw error
  })
  await conexion
}

// Manda HTML autocontenido directo a una impresora térmica, sin pasar por el diálogo de
// impresión del navegador. Requiere QZ Tray corriendo en la máquina (agente local, ver
// docs/FRONTEND.md) — si no está corriendo, el `connect()` rechaza y el llamador decide qué
// avisarle al cajero; nunca debe bloquear la venta, que ya quedó registrada en el servidor.
export async function imprimirTicketTermico(html: string, impresora?: string): Promise<void> {
  await asegurarConexion()
  const nombreImpresora = impresora ?? (await qz.printers.getDefault())
  const config = qz.configs.create(nombreImpresora)
  await qz.print(config, [{ type: 'pixel', format: 'html', flavor: 'plain', data: html }])
}
