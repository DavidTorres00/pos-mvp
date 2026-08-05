import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import {
  createReglaReorden,
  setEstadoReglaReorden,
  updateReglaReorden,
  type ReglaReorden,
  type ReglaReordenPayload,
} from '@/services/reglaReordenService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function useCrearReglaReorden() {
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useApiMutation(
    (payload: ReglaReordenPayload) => createReglaReorden(payload, sucursalId),
    [['reglas-reorden']],
  )
}

export function useUpdateReglaReorden() {
  return useApiMutation(
    ({ id, payload }: { id: number; payload: Omit<ReglaReordenPayload, 'producto_id'> }) =>
      updateReglaReorden(id, payload),
    [['reglas-reorden']],
  )
}

export function useSetEstadoReglaReorden() {
  return useOptimisticToggle<ReglaReorden>(['reglas-reorden'], ({ id, activo }) => setEstadoReglaReorden(id, activo))
}
