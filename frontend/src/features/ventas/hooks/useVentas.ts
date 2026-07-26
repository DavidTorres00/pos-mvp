import { useQuery } from '@tanstack/react-query'

import { listVentas } from '@/services/ventaService'

export function useVentas() {
  return useQuery({
    queryKey: ['ventas'],
    queryFn: () => listVentas(),
  })
}
