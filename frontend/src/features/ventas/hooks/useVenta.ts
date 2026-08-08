import { useQuery } from '@tanstack/react-query'

import { getVenta } from '@/services/ventaService'

export function useVenta(ventaId: number | undefined) {
  return useQuery({
    queryKey: ['venta', ventaId],
    queryFn: () => getVenta(ventaId as number),
    enabled: ventaId !== undefined,
    retry: false,
  })
}
