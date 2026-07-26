import { useQuery } from '@tanstack/react-query'

import { listProductos } from '@/services/productoService'

export function useProductos(q: string) {
  return useQuery({
    queryKey: ['productos', q],
    queryFn: () => listProductos(q || undefined),
  })
}
