import { useQuery } from '@tanstack/react-query'

import { getEquiposDisponibles } from '@/services/equipoService'

export function useEquiposDisponibles() {
  return useQuery({ queryKey: ['equipos-disponibles'], queryFn: getEquiposDisponibles })
}
