import { useQuery } from '@tanstack/react-query'

import { getCajaActual } from '@/services/cajaService'

export function useCajaActual(enabled: boolean = true) {
  return useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => getCajaActual(),
    enabled,
  })
}
