import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import { createProducto, setEstadoProducto, updateProducto } from '@/services/productoService'
import type { Producto, ProductoPayload } from '@/services/productoService'

export function useCreateProducto() {
  return useApiMutation((payload: ProductoPayload) => createProducto(payload), [['productos']])
}

export function useUpdateProducto() {
  return useApiMutation(
    ({ id, payload }: { id: number; payload: ProductoPayload }) => updateProducto(id, payload),
    [['productos']],
  )
}

export function useSetEstadoProducto() {
  return useOptimisticToggle<Producto>(['productos'], ({ id, activo }) => setEstadoProducto(id, activo))
}
