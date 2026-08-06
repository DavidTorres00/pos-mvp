import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createEquipo, setEstadoEquipo, updateEquipo } from '@/services/equipoService'
import type { EquipoPayload } from '@/services/equipoService'

export function useCrearEquipo() {
  return useApiMutation((payload: EquipoPayload) => createEquipo(payload), [['equipos'], ['sucursal-cajas']])
}

export function useUpdateEquipo() {
  return useApiMutation(
    ({ id, nombre }: { id: number; nombre: string }) => updateEquipo(id, nombre),
    [['equipos'], ['sucursal-cajas']],
  )
}

export function useSetEstadoEquipo() {
  return useApiMutation(
    ({ id, activo }: { id: number; activo: boolean }) => setEstadoEquipo(id, activo),
    [['equipos'], ['sucursal-cajas']],
  )
}
