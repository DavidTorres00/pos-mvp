import { api } from '@/services/api'
import type { Categoria } from '@/services/categoriaService'
import type { PaginatedResponse } from '@/services/pagination'
import type { Subcategoria } from '@/services/subcategoriaService'

// Catálogo puro (sin cantidad) — el stock ya no vive en Producto, es por sucursal. Usado tal
// cual para referencias anidadas (item de compra, movimiento, regla/orden de reorden).
export interface Producto {
  id: number
  nombre: string
  sku: string
  precio_venta: string
  activo: boolean
  categoria_id: number | null
  categoria: Categoria | null
  subcategoria_id: number | null
  subcategoria: Subcategoria | null
}

// Producto + stock de UNA sucursal específica — solo tiene sentido en el listado/detalle de
// Productos, donde ese contexto (sucursal activa) existe.
export interface ProductoConStock extends Producto {
  stock: number
}

export interface ProductoPayload {
  nombre: string
  sku: string | null
  precio_venta: number
  categoria_id: number | null
  subcategoria_id: number | null
}

export interface ListProductosParams {
  q?: string
  activo?: boolean
  categoriaId?: number | null
  sucursalId?: number | null
  page?: number
  size?: number
}

export async function listProductos(
  params: ListProductosParams = {},
): Promise<PaginatedResponse<ProductoConStock>> {
  const { q, activo, categoriaId, sucursalId, page, size } = params
  const { data } = await api.get<PaginatedResponse<ProductoConStock>>('/productos', {
    params: {
      q: q || undefined,
      activo,
      categoria_id: categoriaId ?? undefined,
      sucursal_id: sucursalId ?? undefined,
      page,
      size,
    },
  })
  return data
}

export async function createProducto(payload: ProductoPayload): Promise<Producto> {
  const { data } = await api.post<Producto>('/productos', payload)
  return data
}

export async function updateProducto(id: number, payload: ProductoPayload): Promise<Producto> {
  const { data } = await api.put<Producto>(`/productos/${id}`, payload)
  return data
}

export async function setEstadoProducto(id: number, activo: boolean): Promise<Producto> {
  const { data } = await api.patch<Producto>(`/productos/${id}/estado`, { activo })
  return data
}
