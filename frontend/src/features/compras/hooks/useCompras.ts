import { useQuery } from '@tanstack/react-query'

import { listCompras } from '@/services/compraService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function useCompras(page = 1, size = 20, enabled = true) {
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useQuery({
    queryKey: ['compras', sucursalId, page, size],
    queryFn: () => listCompras({ sucursalId, page, size }),
    enabled,
  })
}
