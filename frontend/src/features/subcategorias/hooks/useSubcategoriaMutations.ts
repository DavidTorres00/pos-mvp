import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import { createSubcategoria, setEstadoSubcategoria, updateSubcategoria } from '@/services/subcategoriaService'
import type { Subcategoria, SubcategoriaPayload } from '@/services/subcategoriaService'

export function useCrearSubcategoria() {
  return useApiMutation((payload: SubcategoriaPayload) => createSubcategoria(payload), [['subcategorias']])
}

export function useUpdateSubcategoria() {
  return useApiMutation(
    ({ id, nombre }: { id: number; nombre: string }) => updateSubcategoria(id, nombre),
    [['subcategorias']],
  )
}

export function useSetEstadoSubcategoria() {
  return useOptimisticToggle<Subcategoria>(['subcategorias'], ({ id, activo }) => setEstadoSubcategoria(id, activo))
}
