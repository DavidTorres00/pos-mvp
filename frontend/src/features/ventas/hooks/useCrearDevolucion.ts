import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { crearDevolucion } from '@/services/ventaService'
import type { DevolucionPayload } from '@/services/ventaService'

export function useCrearDevolucion() {
  return useApiMutation(
    ({ ventaId, payload }: { ventaId: number; payload: DevolucionPayload }) => crearDevolucion(ventaId, payload),
    [
      ['ventas'],
      ['ventas-resumen'],
      ['ventas-mas-vendidos'],
      ['ventas-por-dia'],
      ['ventas-por-sucursal'],
      ['devoluciones-venta'],
      ['productos'],
      ['movimientos'],
      ['caja-actual'],
    ],
  )
}
