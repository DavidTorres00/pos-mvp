import { useQuery } from '@tanstack/react-query'

import { getResumenCaja } from '@/services/cajaService'

export function useCajaResumen(cajaId: number | undefined) {
  return useQuery({
    queryKey: ['caja-resumen', cajaId],
    queryFn: () => getResumenCaja(cajaId as number),
    enabled: cajaId !== undefined,
  })
}
