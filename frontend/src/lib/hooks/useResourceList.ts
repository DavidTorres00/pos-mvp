import { useQuery, type QueryKey } from '@tanstack/react-query'

export function useResourceList<T>(
  queryKey: QueryKey,
  listFn: (search?: string) => Promise<T[]>,
  search: string,
) {
  return useQuery({
    queryKey: [...queryKey, search],
    queryFn: () => listFn(search || undefined),
  })
}
