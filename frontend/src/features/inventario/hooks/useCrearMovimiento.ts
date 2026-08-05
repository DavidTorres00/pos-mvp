import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createMovimiento } from '@/services/inventarioService'
import type { MovimientoPayload } from '@/services/inventarioService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function useCrearMovimiento() {
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useApiMutation(
    (payload: MovimientoPayload) => createMovimiento(payload, sucursalId),
    [['movimientos'], ['productos']],
  )
}
