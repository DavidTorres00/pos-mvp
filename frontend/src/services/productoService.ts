import { api } from '@/services/api'
import type { Categoria } from '@/services/categoriaService'

export interface Producto {
  id: number
  nombre: string
  sku: string
  precio_venta: string
  stock: number
  activo: boolean
  categoria_id: number | null
  categoria: Categoria | null
}

export interface ProductoPayload {
  nombre: string
  sku: string
  precio_venta: number
  categoria_id: number | null
}

export async function listProductos(q?: string): Promise<Producto[]> {
  const { data } = await api.get<Producto[]>('/productos', { params: q ? { q } : undefined })
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
