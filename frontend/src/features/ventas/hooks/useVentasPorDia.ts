import { useQuery } from '@tanstack/react-query'

import { getVentasPorDia } from '@/services/ventaService'
import type { ResumenVentasParams } from '@/services/ventaService'

export function useVentasPorDia(filtros: ResumenVentasParams = {}, enabled = true) {
  const { desde, hasta, formaPago, sucursalId, usuarioId } = filtros
  return useQuery({
    queryKey: ['ventas-por-dia', desde, hasta, formaPago, sucursalId, usuarioId],
    queryFn: () => getVentasPorDia({ desde, hasta, formaPago, sucursalId, usuarioId }),
    enabled,
  })
}
