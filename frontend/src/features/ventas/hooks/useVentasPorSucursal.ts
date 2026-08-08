import { useQuery } from '@tanstack/react-query'

import { getVentasPorSucursal } from '@/services/ventaService'
import type { PorSucursalParams } from '@/services/ventaService'

export function useVentasPorSucursal(filtros: PorSucursalParams = {}, enabled = true) {
  const { desde, hasta, formaPago, usuarioId } = filtros
  return useQuery({
    queryKey: ['ventas-por-sucursal', desde, hasta, formaPago, usuarioId],
    queryFn: () => getVentasPorSucursal({ desde, hasta, formaPago, usuarioId }),
    enabled,
  })
}
