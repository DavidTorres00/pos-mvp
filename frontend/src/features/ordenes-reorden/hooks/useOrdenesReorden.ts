import { useQuery } from '@tanstack/react-query'

import { listOrdenesReorden, type EstadoOrdenReorden } from '@/services/ordenReordenService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function useOrdenesReorden(estado: EstadoOrdenReorden | undefined, page: number, size: number) {
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useQuery({
    queryKey: ['ordenes-reorden', estado, sucursalId, page, size],
    queryFn: () => listOrdenesReorden({ estado, sucursalId, page, size }),
  })
}
