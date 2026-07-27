import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { abrirCaja, cerrarCaja, crearMovimientoCaja } from '@/services/cajaService'
import type { MovimientoCajaPayload } from '@/services/cajaService'

export function useAbrirCaja() {
  return useApiMutation((monto_inicial: number) => abrirCaja(monto_inicial), [['caja-actual'], ['reporte-caja']])
}

export function useCerrarCaja() {
  return useApiMutation((monto_final: number) => cerrarCaja(monto_final), [['caja-actual'], ['reporte-caja']])
}

export function useCrearMovimientoCaja() {
  return useApiMutation(
    (payload: MovimientoCajaPayload) => crearMovimientoCaja(payload),
    [['caja-actual'], ['caja-movimientos'], ['caja-resumen'], ['reporte-caja']],
  )
}
