import { useQuery, type QueryKey } from '@tanstack/react-query'

import type { PaginatedResponse } from '@/services/pagination'

interface ResourceListParams {
  q: string
  page: number
  size: number
}

export function useResourceList<T>(
  queryKey: QueryKey,
  listFn: (params: { q?: string; page?: number; size?: number }) => Promise<PaginatedResponse<T>>,
  { q, page, size }: ResourceListParams,
) {
  return useQuery({
    queryKey: [...queryKey, q, page, size],
    queryFn: () => listFn({ q: q || undefined, page, size }),
  })
}
