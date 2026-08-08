import { useQuery } from '@tanstack/react-query'

import { getMasVendidos } from '@/services/ventaService'
import type { ResumenVentasParams } from '@/services/ventaService'

export function useMasVendidos(filtros: ResumenVentasParams = {}, enabled = true) {
  const { desde, hasta, formaPago, sucursalId, usuarioId } = filtros
  return useQuery({
    queryKey: ['ventas-mas-vendidos', desde, hasta, formaPago, sucursalId, usuarioId],
    queryFn: () => getMasVendidos({ desde, hasta, formaPago, sucursalId, usuarioId, limite: 5 }),
    enabled,
  })
}
