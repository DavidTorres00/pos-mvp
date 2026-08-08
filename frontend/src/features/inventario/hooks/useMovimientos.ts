import { useQuery } from '@tanstack/react-query'

import { listMovimientos } from '@/services/inventarioService'
import type { TipoMovimiento } from '@/services/inventarioService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

interface UseMovimientosFiltros {
  q?: string
  tipo?: TipoMovimiento
  desde?: string
  hasta?: string
}

export function useMovimientos(filtros: UseMovimientosFiltros, page = 1, size = 20, enabled = true) {
  const { q, tipo, desde, hasta } = filtros
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useQuery({
    queryKey: ['movimientos', q, tipo, desde, hasta, sucursalId, page, size],
    queryFn: () => listMovimientos({ q, tipo, desde, hasta, sucursalId, page, size }),
    enabled,
  })
}
