import { useQuery } from '@tanstack/react-query'

import { getCajaActual } from '@/services/cajaService'

export function useCajaActual(enabled: boolean = true) {
  return useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => getCajaActual(),
    enabled,
    // un admin puede retirar el excedente o cerrar la caja de este cajero desde otra sesión —
    // sin polling, el cajero se quedaría con la pantalla de bloqueo (o la caja "abierta") vieja
    // hasta que alguna acción propia disparara un refetch
    refetchInterval: 15_000,
  })
}
