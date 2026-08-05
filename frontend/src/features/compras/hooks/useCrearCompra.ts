import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createCompra } from '@/services/compraService'
import type { CompraPayload } from '@/services/compraService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function useCrearCompra() {
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useApiMutation(
    (payload: CompraPayload) => createCompra(payload, sucursalId),
    [['compras'], ['productos'], ['movimientos']],
  )
}
