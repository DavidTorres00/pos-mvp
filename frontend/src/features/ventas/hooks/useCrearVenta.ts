import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createVenta } from '@/services/ventaService'
import type { VentaPayload } from '@/services/ventaService'

export function useCrearVenta() {
  return useApiMutation(
    (payload: VentaPayload) => createVenta(payload),
    [['ventas'], ['productos'], ['movimientos'], ['caja-actual'], ['caja-resumen']],
  )
}
