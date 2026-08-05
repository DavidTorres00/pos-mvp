import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { abrirCaja, cerrarCaja, crearMovimientoCaja, retirarExcedenteCaja } from '@/services/cajaService'
import type { MovimientoCajaPayload } from '@/services/cajaService'

export function useAbrirCaja() {
  return useApiMutation(
    ({ equipo_id, monto_inicial }: { equipo_id: number; monto_inicial: number }) => abrirCaja(equipo_id, monto_inicial),
    [['caja-actual'], ['cajas-abiertas']],
  )
}

export function useCerrarCaja() {
  return useApiMutation((monto_final: number) => cerrarCaja(monto_final), [
    ['caja-actual'],
    ['cajas-abiertas'],
    ['usuarios'],
  ])
}

export function useCrearMovimientoCaja() {
  return useApiMutation(
    (payload: MovimientoCajaPayload) => crearMovimientoCaja(payload),
    [['caja-actual'], ['caja-movimientos'], ['caja-resumen'], ['cajas-abiertas']],
  )
}

export function useRetirarExcedenteCaja() {
  return useApiMutation(
    () => retirarExcedenteCaja(),
    [['caja-actual'], ['caja-movimientos'], ['caja-resumen'], ['cajas-abiertas'], ['auditoria']],
  )
}
