import { useQuery } from '@tanstack/react-query'

import { getResumenCaja, listMovimientosCaja } from '@/services/cajaService'

export function useCajaResumen(cajaId: number | undefined) {
  return useQuery({
    queryKey: ['caja-resumen', cajaId],
    queryFn: () => getResumenCaja(cajaId as number),
    enabled: cajaId !== undefined,
  })
}

export function useCajaMovimientos(cajaId: number | undefined, page = 1, size = 20) {
  return useQuery({
    queryKey: ['caja-movimientos', cajaId, page, size],
    queryFn: () => listMovimientosCaja(cajaId as number, { page, size }),
    enabled: cajaId !== undefined,
  })
}
