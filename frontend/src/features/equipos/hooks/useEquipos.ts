import { useQuery } from '@tanstack/react-query'

import { listEquipos } from '@/services/equipoService'

export function useEquipos(sucursalId: number | null, page = 1, size = 100) {
  return useQuery({
    queryKey: ['equipos', sucursalId, page, size],
    queryFn: () => listEquipos({ sucursal_id: sucursalId ?? undefined, page, size }),
    enabled: sucursalId !== null,
  })
}
