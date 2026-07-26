import { useQuery } from '@tanstack/react-query'

import { listCompras } from '@/services/compraService'

export function useCompras() {
  return useQuery({
    queryKey: ['compras'],
    queryFn: () => listCompras(),
  })
}
