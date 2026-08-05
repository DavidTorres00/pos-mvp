import { useQuery } from '@tanstack/react-query'

import { listReglasReorden } from '@/services/reglaReordenService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function useReglasReorden(page: number, size: number) {
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useQuery({
    queryKey: ['reglas-reorden', sucursalId, page, size],
    queryFn: () => listReglasReorden({ sucursalId, page, size }),
  })
}
