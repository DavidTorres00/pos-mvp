import { useQuery } from '@tanstack/react-query'

import { getCajaActual } from '@/services/cajaService'

export function useCajaActual() {
  return useQuery({
    queryKey: ['caja-actual'],
    queryFn: () => getCajaActual(),
  })
}
