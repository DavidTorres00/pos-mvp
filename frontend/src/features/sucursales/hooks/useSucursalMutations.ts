import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import { createSucursal, setEstadoSucursal, updateSucursal } from '@/services/sucursalService'
import type { Sucursal, SucursalPayload } from '@/services/sucursalService'

export function useCrearSucursal() {
  return useApiMutation((payload: SucursalPayload) => createSucursal(payload), [['sucursales']])
}

export function useUpdateSucursal() {
  return useApiMutation(
    ({ id, payload }: { id: number; payload: SucursalPayload }) => updateSucursal(id, payload),
    [['sucursales']],
  )
}

export function useSetEstadoSucursal() {
  return useOptimisticToggle<Sucursal>(['sucursales'], ({ id, activo }) => setEstadoSucursal(id, activo))
}
