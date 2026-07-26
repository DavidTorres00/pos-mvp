import { useMutation, useQueryClient } from '@tanstack/react-query'

import { abrirCaja, cerrarCaja, crearMovimientoCaja } from '@/services/cajaService'
import type { MovimientoCajaPayload } from '@/services/cajaService'

export function useAbrirCaja() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (monto_inicial: number) => abrirCaja(monto_inicial),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caja-actual'] }),
  })
}

export function useCerrarCaja() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (monto_final: number) => cerrarCaja(monto_final),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['caja-actual'] }),
  })
}

export function useCrearMovimientoCaja() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: MovimientoCajaPayload) => crearMovimientoCaja(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-actual'] })
      queryClient.invalidateQueries({ queryKey: ['caja-movimientos'] })
      queryClient.invalidateQueries({ queryKey: ['caja-resumen'] })
    },
  })
}
