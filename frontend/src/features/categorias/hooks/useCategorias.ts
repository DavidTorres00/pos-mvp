import { useQuery } from '@tanstack/react-query'

import { listCategorias } from '@/services/categoriaService'

// Aparte de useResourceList (lib/hooks/): ese contrato genérico es {q, page, size}, compartido
// con Sucursales/Proveedores — sucursalId es propio de Categorías (para tiene_alerta_stock, ver
// categoriaService.ts), no vale la pena meterlo en el hook genérico por un solo consumidor.
export function useCategorias(q: string, sucursalId: number | null, page = 1, size = 20) {
  return useQuery({
    queryKey: ['categorias', q, sucursalId, page, size],
    queryFn: () => listCategorias({ q: q || undefined, sucursalId, page, size }),
  })
}
