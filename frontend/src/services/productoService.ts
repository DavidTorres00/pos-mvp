import { api } from '@/services/api'
import type { Categoria } from '@/services/categoriaService'
import type { PaginatedResponse } from '@/services/pagination'
import type { Subcategoria } from '@/services/subcategoriaService'

export interface Producto {
  id: number
  nombre: string
  sku: string
  precio_venta: string
  stock: number
  activo: boolean
  categoria_id: number | null
  categoria: Categoria | null
  subcategoria_id: number | null
  subcategoria: Subcategoria | null
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
  page?: number
  size?: number
}

export async function listProductos(params: ListProductosParams = {}): Promise<PaginatedResponse<Producto>> {
  const { q, page, size } = params
  const { data } = await api.get<PaginatedResponse<Producto>>('/productos', {
    params: { q: q || undefined, page, size },
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
