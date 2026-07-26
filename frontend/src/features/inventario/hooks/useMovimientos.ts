import { useQuery } from '@tanstack/react-query'

import { listMovimientos } from '@/services/inventarioService'

export function useMovimientos() {
  return useQuery({
    queryKey: ['movimientos'],
    queryFn: () => listMovimientos(),
  })
}
