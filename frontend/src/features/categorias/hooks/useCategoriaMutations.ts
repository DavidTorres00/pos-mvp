import { useMutation, useQueryClient } from '@tanstack/react-query'

import { createCategoria, setEstadoCategoria, updateCategoria } from '@/services/categoriaService'
import type { CategoriaPayload } from '@/services/categoriaService'

export function useCreateCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CategoriaPayload) => createCategoria(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoriaPayload }) => updateCategoria(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })
}

export function useSetEstadoCategoria() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) => setEstadoCategoria(id, activo),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categorias'] }),
  })
}
