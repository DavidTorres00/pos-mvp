import { useQuery } from '@tanstack/react-query'

import { getResumenVentas } from '@/services/ventaService'
import type { ResumenVentasParams } from '@/services/ventaService'

export function useResumenVentas(filtros: ResumenVentasParams = {}, enabled = true) {
  const { desde, hasta, formaPago, sucursalId, usuarioId } = filtros
  return useQuery({
    queryKey: ['ventas-resumen', desde, hasta, formaPago, sucursalId, usuarioId],
    queryFn: () => getResumenVentas({ desde, hasta, formaPago, sucursalId, usuarioId }),
    enabled,
  })
}
