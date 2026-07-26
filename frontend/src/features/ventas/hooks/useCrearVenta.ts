import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createVenta } from '@/services/ventaService'
import type { VentaPayload } from '@/services/ventaService'

export function useCrearVenta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: VentaPayload) => createVenta(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      queryClient.invalidateQueries({ queryKey: ['movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] })
      queryClient.invalidateQueries({ queryKey: ['caja-resumen'] })
    },
  })
}
