import { useQuery } from '@tanstack/react-query'

import { listMovimientos } from '@/services/inventarioService'
import type { TipoMovimiento } from '@/services/inventarioService'

interface UseMovimientosFiltros {
  q?: string
  tipo?: TipoMovimiento
  desde?: string
  hasta?: string
}

export function useMovimientos(filtros: UseMovimientosFiltros, page = 1, size = 20) {
  const { q, tipo, desde, hasta } = filtros
  return useQuery({
    queryKey: ['movimientos', q, tipo, desde, hasta, page, size],
    queryFn: () => listMovimientos({ q, tipo, desde, hasta, page, size }),
  })
}
