import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { aprobarOrdenReorden, rechazarOrdenReorden } from '@/services/ordenReordenService'

export function useRechazarOrdenReorden() {
  return useApiMutation((id: number) => rechazarOrdenReorden(id), [['ordenes-reorden'], ['auditoria']])
}

export function useAprobarOrdenReorden() {
  return useApiMutation((id: number) => aprobarOrdenReorden(id), [['ordenes-reorden'], ['auditoria']])
}
