import { useResourceList } from '@/lib/hooks/useResourceList'
import { listCategorias } from '@/services/categoriaService'

export function useCategorias(q: string) {
  return useResourceList(['categorias'], listCategorias, q)
}
