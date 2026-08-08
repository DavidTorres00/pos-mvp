import { useQuery } from '@tanstack/react-query'

import { listVentas } from '@/services/ventaService'
import type { ResumenVentasParams } from '@/services/ventaService'

export function useVentas(filtros: ResumenVentasParams = {}, page = 1, size = 20, enabled = true) {
  const { desde, hasta, formaPago, sucursalId, usuarioId } = filtros
  return useQuery({
    queryKey: ['ventas', desde, hasta, formaPago, sucursalId, usuarioId, page, size],
    queryFn: () => listVentas({ desde, hasta, formaPago, sucursalId, usuarioId, page, size }),
    enabled,
  })
}
