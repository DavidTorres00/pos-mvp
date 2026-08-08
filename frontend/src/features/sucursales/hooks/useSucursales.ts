import { useResourceList } from '@/lib/hooks/useResourceList'
import { listSucursales } from '@/services/sucursalService'

export function useSucursales(q: string, page = 1, size = 20, enabled = true) {
  return useResourceList(['sucursales'], listSucursales, { q, page, size, enabled })
}
