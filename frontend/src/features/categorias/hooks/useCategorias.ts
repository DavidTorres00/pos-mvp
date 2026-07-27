import { useResourceList } from '@/lib/hooks/useResourceList'
import { listCategorias } from '@/services/categoriaService'

export function useCategorias(q: string, page = 1, size = 20) {
  return useResourceList(['categorias'], listCategorias, { q, page, size })
}
