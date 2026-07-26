import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createProducto, setEstadoProducto, updateProducto } from '@/services/productoService'
import type { ProductoPayload } from '@/services/productoService'

export function useCreateProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProductoPayload) => createProducto(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })
}

export function useUpdateProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProductoPayload }) => updateProducto(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })
}

export function useSetEstadoProducto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => setEstadoProducto(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['productos'] }),
  })
}
