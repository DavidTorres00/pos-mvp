import { useQuery } from '@tanstack/react-query'

import { listProductos } from '@/services/productoService'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

interface UseProductosFiltros {
  q?: string
  activo?: boolean
  categoriaId?: number | null
  proveedorId?: number | null
}

// sucursalId viaja siempre desde el store: para un cajero queda en null (nunca ve el selector,
// el servidor lo ignora y usa su propia sucursal); para el admin es la sucursal que eligió en
// pantalla — así este hook no necesita que cada pantalla se lo pase explícitamente.
export function useProductos(filtros: UseProductosFiltros, page = 1, size = 20) {
  const { q, activo, categoriaId, proveedorId } = filtros
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  return useQuery({
    queryKey: ['productos', q, activo, categoriaId, proveedorId, sucursalId, page, size],
    queryFn: () => listProductos({ q: q || undefined, activo, categoriaId, proveedorId, sucursalId, page, size }),
  })
}
