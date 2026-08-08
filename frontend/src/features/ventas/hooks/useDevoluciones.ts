import { useQuery } from '@tanstack/react-query'

import { listDevoluciones } from '@/services/ventaService'

export function useDevoluciones(ventaId: number | undefined) {
  return useQuery({
    queryKey: ['devoluciones-venta', ventaId],
    queryFn: () => listDevoluciones(ventaId as number),
    enabled: ventaId !== undefined,
  })
}
