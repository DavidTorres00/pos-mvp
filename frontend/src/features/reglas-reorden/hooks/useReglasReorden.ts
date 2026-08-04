import { useQuery } from '@tanstack/react-query'

import { listReglasReorden } from '@/services/reglaReordenService'

export function useReglasReorden(page: number, size: number) {
  return useQuery({
    queryKey: ['reglas-reorden', page, size],
    queryFn: () => listReglasReorden({ page, size }),
  })
}
