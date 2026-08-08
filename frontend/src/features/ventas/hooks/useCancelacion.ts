import { useQuery } from '@tanstack/react-query'

import { getCancelacion } from '@/services/ventaService'

// solo tiene sentido consultar si la venta ya está cancelada (ver VentaDetalleDialog) — para el
// resto no hay nada que buscar, evita una llamada de red por cada venta completada que se abre
export function useCancelacion(ventaId: number | undefined, habilitado: boolean) {
  return useQuery({
    queryKey: ['cancelacion-venta', ventaId],
    queryFn: () => getCancelacion(ventaId as number),
    enabled: ventaId !== undefined && habilitado,
  })
}
