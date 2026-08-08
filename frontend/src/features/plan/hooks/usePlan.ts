import { useQuery } from '@tanstack/react-query'

import { getPlan } from '@/services/planService'

export function usePlan(enabled: boolean) {
  return useQuery({
    queryKey: ['plan'],
    queryFn: getPlan,
    enabled,
  })
}
