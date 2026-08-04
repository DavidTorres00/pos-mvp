import { useQuery } from '@tanstack/react-query'

import { listUsuarios } from '@/services/usuarioService'

export function useUsuarios(page: number, size: number, enabled: boolean) {
  return useQuery({
    queryKey: ['usuarios', page, size],
    queryFn: () => listUsuarios({ page, size }),
    enabled,
  })
}
