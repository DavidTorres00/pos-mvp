import { useQuery } from '@tanstack/react-query'

import { listMovimientos } from '@/services/inventarioService'

export function useMovimientos(page = 1, size = 20) {
  return useQuery({
    queryKey: ['movimientos', page, size],
    queryFn: () => listMovimientos({ page, size }),
  })
}
