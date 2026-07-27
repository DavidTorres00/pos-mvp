import { useQuery } from '@tanstack/react-query'

import { listVentas } from '@/services/ventaService'

export function useVentas(page = 1, size = 20) {
  return useQuery({
    queryKey: ['ventas', page, size],
    queryFn: () => listVentas({ page, size }),
  })
}
