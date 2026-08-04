import { useQuery } from '@tanstack/react-query'

import { listSubcategorias } from '@/services/subcategoriaService'

export function useSubcategorias(categoriaId: number | null, page = 1, size = 100) {
  return useQuery({
    queryKey: ['subcategorias', categoriaId, page, size],
    queryFn: () => listSubcategorias({ categoria_id: categoriaId ?? undefined, page, size }),
    enabled: categoriaId !== null,
  })
}
