import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { crearCancelacion } from '@/services/ventaService'
import type { CancelacionPayload } from '@/services/ventaService'

export function useCrearCancelacion() {
  return useApiMutation(
    ({ ventaId, payload }: { ventaId: number; payload: CancelacionPayload }) => crearCancelacion(ventaId, payload),
    [
      ['ventas'],
      ['ventas-resumen'],
      ['ventas-mas-vendidos'],
      ['ventas-por-dia'],
      ['ventas-por-sucursal'],
      ['cancelacion-venta'],
      ['productos'],
      ['movimientos'],
      ['caja-actual'],
    ],
  )
}
