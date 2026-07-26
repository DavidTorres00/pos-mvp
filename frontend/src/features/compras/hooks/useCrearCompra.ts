import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createCompra } from '@/services/compraService'
import type { CompraPayload } from '@/services/compraService'

export function useCrearCompra() {
  return useApiMutation(
    (payload: CompraPayload) => createCompra(payload),
    [['compras'], ['productos'], ['movimientos']],
  )
}
