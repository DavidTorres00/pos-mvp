import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useNavigatorOnline } from '@/lib/hooks/useNavigatorOnline'
import { api } from '@/services/api'
import { useServidorStore } from '@/stores/servidorStore'

// Heartbeat siempre montado (ver layouts/ProtectedLayout.tsx), sin importar rol ni ruta —
// detecta una caída de servidor incluso en una pantalla sin ninguna query propia (ej. 404), que
// de otro modo se quedaría sin ninguna señal para activar el gate. Éxito/error en sí no se lee
// aquí: el interceptor de services/api.ts ya resuelve caido/disponible sobre esta misma request.
// Más rápido mientras está caído (recuperación snappy), más espaciado mientras todo va bien.
export function useSaludServidor(enabled: boolean) {
  const caido = useServidorStore((state) => state.caido)
  const queryClient = useQueryClient()
  const online = useNavigatorOnline()

  useQuery({
    queryKey: ['salud-servidor'],
    queryFn: () => api.get('/health'),
    refetchInterval: caido ? 5_000 : 20_000,
    retry: false,
    enabled,
    // no debe disparar el toast genérico de error (ver app/providers.tsx) — es un heartbeat de
    // fondo, su resultado ya lo consume servidorStore vía el interceptor de services/api.ts
    meta: { silent: true },
  })

  // cualquier cambio de `online` (se desconecta o vuelve el cable/Wi-Fi) fuerza un chequeo
  // inmediato en vez de esperar el siguiente tick del heartbeat
  useEffect(() => {
    if (!enabled) return
    queryClient.refetchQueries({ queryKey: ['salud-servidor'] })
  }, [online, enabled, queryClient])
}
