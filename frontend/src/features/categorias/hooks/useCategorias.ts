import { useQuery } from '@tanstack/react-query'

import { listCategorias } from '@/services/categoriaService'

export function useCategorias(q: string) {
  return useQuery({
    queryKey: ['categorias', q],
    queryFn: () => listCategorias(q || undefined),
  })
}
