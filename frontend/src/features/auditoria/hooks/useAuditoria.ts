import { useQuery } from '@tanstack/react-query'

import { listAuditoria, type ListAuditoriaParams } from '@/services/auditoriaService'

export function useAuditoria(params: ListAuditoriaParams, enabled: boolean) {
  return useQuery({
    queryKey: ['auditoria', params],
    queryFn: () => listAuditoria(params),
    enabled,
  })
}
