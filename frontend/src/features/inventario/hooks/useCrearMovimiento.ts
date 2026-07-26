import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createMovimiento } from '@/services/inventarioService'
import type { MovimientoPayload } from '@/services/inventarioService'

export function useCrearMovimiento() {
  return useApiMutation(
    (payload: MovimientoPayload) => createMovimiento(payload),
    [['movimientos'], ['productos']],
  )
}
