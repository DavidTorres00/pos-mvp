import { useResourceList } from '@/lib/hooks/useResourceList'
import { listProductos } from '@/services/productoService'

export function useProductos(q: string) {
  return useResourceList(['productos'], listProductos, q)
}
