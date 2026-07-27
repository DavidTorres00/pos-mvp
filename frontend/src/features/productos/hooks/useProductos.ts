import { useResourceList } from '@/lib/hooks/useResourceList'
import { listProductos } from '@/services/productoService'

export function useProductos(q: string, page = 1, size = 20) {
  return useResourceList(['productos'], listProductos, { q, page, size })
}
