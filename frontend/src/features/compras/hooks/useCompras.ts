import { useQuery } from '@tanstack/react-query'

import { listCompras } from '@/services/compraService'

export function useCompras(page = 1, size = 20, enabled = true) {
  return useQuery({
    queryKey: ['compras', page, size],
    queryFn: () => listCompras({ page, size }),
    enabled,
  })
}
