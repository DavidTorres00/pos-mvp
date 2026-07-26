import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCompra } from '@/services/compraService'
import type { CompraPayload } from '@/services/compraService'

export function useCrearCompra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CompraPayload) => createCompra(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compras'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
    },
  })
}
