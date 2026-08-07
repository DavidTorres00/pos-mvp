import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { aprobarCompra, rechazarCompra, recibirCompra } from '@/services/compraService'
import type { RecibirCompraItemPayload } from '@/services/compraService'

export function useAprobarCompra() {
  return useApiMutation((id: number) => aprobarCompra(id), [['compras'], ['proveedores']])
}

export function useRechazarCompra() {
  return useApiMutation((id: number) => rechazarCompra(id), [['compras'], ['proveedores']])
}

export function useRecibirCompra() {
  return useApiMutation(
    ({ id, items }: { id: number; items: RecibirCompraItemPayload[] }) => recibirCompra(id, items),
    [['compras'], ['productos'], ['movimientos'], ['proveedores']],
  )
}
