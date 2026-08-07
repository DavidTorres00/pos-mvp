import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

// Catálogo puro — es el que va embebido en Producto.categoria/Subcategoria.categoria (ventas,
// compras, movimientos, etc.). Sin conteos: esos endpoints nunca los calculan.
export interface Categoria {
  id: number
  nombre: string
  codigo: string
  activo: boolean
}

// Categoria + conteos — lo que devuelven todos los endpoints de /categorias (hub de Productos,
// ver docs/FRONTEND.md). Mismo split que ProductoConStock sobre Producto.
export interface CategoriaResumen extends Categoria {
  total_subcategorias: number
  total_productos: number
  // ambos solo reflejan la realidad si la llamada mandó sucursalId (ver listCategorias) — si
  // no, siempre 0, no es un "sin alertas" confiable
  productos_sin_stock: number
  productos_stock_bajo: number
}

export interface CategoriaPayload {
  nombre: string
}

export interface ListCategoriasParams {
  q?: string
  sucursalId?: number | null
  page?: number
  size?: number
}

export async function listCategorias(
  params: ListCategoriasParams = {},
): Promise<PaginatedResponse<CategoriaResumen>> {
  const { q, sucursalId, page, size } = params
  const { data } = await api.get<PaginatedResponse<CategoriaResumen>>('/categorias', {
    params: { q: q || undefined, sucursal_id: sucursalId ?? undefined, page, size },
  })
  return data
}

export async function createCategoria(payload: CategoriaPayload): Promise<CategoriaResumen> {
  const { data } = await api.post<CategoriaResumen>('/categorias', payload)
  return data
}

export async function updateCategoria(id: number, payload: CategoriaPayload): Promise<CategoriaResumen> {
  const { data } = await api.put<CategoriaResumen>(`/categorias/${id}`, payload)
  return data
}

export async function setEstadoCategoria(id: number, activo: boolean): Promise<CategoriaResumen> {
  const { data } = await api.patch<CategoriaResumen>(`/categorias/${id}/estado`, { activo })
  return data
}
