import { useResourceList } from '@/lib/hooks/useResourceList'
import { listProveedores } from '@/services/proveedorService'

export function useProveedores(q: string, page = 1, size = 20) {
  return useResourceList(['proveedores'], listProveedores, { q, page, size })
}
