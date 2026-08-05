import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import { createEquipo, setEstadoEquipo, updateEquipo } from '@/services/equipoService'
import type { Equipo, EquipoPayload } from '@/services/equipoService'

export function useCrearEquipo() {
  return useApiMutation((payload: EquipoPayload) => createEquipo(payload), [['equipos']])
}

export function useUpdateEquipo() {
  return useApiMutation(({ id, nombre }: { id: number; nombre: string }) => updateEquipo(id, nombre), [['equipos']])
}

export function useSetEstadoEquipo() {
  return useOptimisticToggle<Equipo>(['equipos'], ({ id, activo }) => setEstadoEquipo(id, activo))
}
