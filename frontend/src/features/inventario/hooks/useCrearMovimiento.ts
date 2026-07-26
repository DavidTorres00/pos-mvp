import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createMovimiento } from '@/services/inventarioService'
import type { MovimientoPayload } from '@/services/inventarioService'

export function useCrearMovimiento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MovimientoPayload) => createMovimiento(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
