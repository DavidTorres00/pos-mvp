import { useQuery } from '@tanstack/react-query'

import { listOrdenesReorden, type EstadoOrdenReorden } from '@/services/ordenReordenService'

export function useOrdenesReorden(estado: EstadoOrdenReorden | undefined, page: number, size: number) {
  return useQuery({
    queryKey: ['ordenes-reorden', estado, page, size],
    queryFn: () => listOrdenesReorden({ estado, page, size }),
  })
}
