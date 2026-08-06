import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Server-Sent Events: complementa el polling de 15s de useCajaActual, no lo reemplaza — cuando
// un admin retira el excedente o cierra la caja de este cajero desde otra sesión, el servidor
// avisa por aquí para invalidar ['caja-actual'] al instante en vez de esperar el próximo ciclo.
// Ningún canal es el único punto de falla: si el navegador no soporta/permite streams, o la
// conexión se cae, el polling sigue cubriendo sin degradar nada. Ninguno transporta el estado
// en sí — ambos solo disparan el mismo refetch contra la misma fuente de verdad (GET
// /caja/actual), así que nunca compiten por la información ni pueden desincronizarse entre sí.
export function useCajaEventos(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const source = new EventSource(`${import.meta.env.VITE_API_URL}/caja/eventos`, { withCredentials: true })
    source.addEventListener('cambio', () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] })
    })
    // sin manejo de onerror: EventSource reintenta la conexión solo (comportamiento nativo del
    // protocolo SSE) — no hay nada que este hook necesite hacer además de eso

    return () => source.close()
  }, [enabled, queryClient])
}
