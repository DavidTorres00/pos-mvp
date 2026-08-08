import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { abrirCaja, cerrarCaja, retirarExcedenteCaja } from '@/services/cajaService'

export function useAbrirCaja() {
  return useApiMutation(
    ({ equipo_id, monto_inicial }: { equipo_id: number; monto_inicial: number }) => abrirCaja(equipo_id, monto_inicial),
    [['caja-actual']],
  )
}

export function useCerrarCaja() {
  return useApiMutation(
    ({ monto_final, motivo_diferencia }: { monto_final: number; motivo_diferencia?: string | null }) =>
      cerrarCaja(monto_final, motivo_diferencia),
    [['caja-actual'], ['usuarios']],
  )
}

export function useRetirarExcedenteCaja() {
  return useApiMutation(
    () => retirarExcedenteCaja(),
    [['caja-actual'], ['caja-resumen'], ['auditoria']],
  )
}
