import { useQuery } from '@tanstack/react-query'

import { getResumenCaja, listMovimientosCaja } from '@/services/cajaService'

export function useCajaResumen(cajaId: number | undefined) {
  return useQuery({
    queryKey: ['caja-resumen', cajaId],
    queryFn: () => getResumenCaja(cajaId as number),
    enabled: cajaId !== undefined,
  })
}

export function useCajaMovimientos(cajaId: number | undefined) {
  return useQuery({
    queryKey: ['caja-movimientos', cajaId],
    queryFn: () => listMovimientosCaja(cajaId as number),
    enabled: cajaId !== undefined,
  })
}
