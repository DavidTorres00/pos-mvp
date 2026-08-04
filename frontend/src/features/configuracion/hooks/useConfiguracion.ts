import { useQuery } from '@tanstack/react-query'

import { getConfiguracion } from '@/services/configuracionService'

export function useConfiguracion(enabled: boolean) {
  return useQuery({
    queryKey: ['configuracion-negocio'],
    queryFn: getConfiguracion,
    enabled,
  })
}
