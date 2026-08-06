import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import { createCategoria, setEstadoCategoria, updateCategoria } from '@/services/categoriaService'
import type { CategoriaPayload, CategoriaResumen } from '@/services/categoriaService'

export function useCrearCategoria() {
  return useApiMutation((payload: CategoriaPayload) => createCategoria(payload), [['categorias']])
}

export function useUpdateCategoria() {
  return useApiMutation(
    ({ id, payload }: { id: number; payload: CategoriaPayload }) => updateCategoria(id, payload),
    [['categorias']],
  )
}

export function useSetEstadoCategoria() {
  return useOptimisticToggle<CategoriaResumen>(['categorias'], ({ id, activo }) => setEstadoCategoria(id, activo))
}
