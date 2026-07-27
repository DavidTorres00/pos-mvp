import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

export interface Categoria {
  id: number
  nombre: string
  activo: boolean
}

export interface CategoriaPayload {
  nombre: string
}

export interface ListCategoriasParams {
  q?: string
  page?: number
  size?: number
}

export async function listCategorias(params: ListCategoriasParams = {}): Promise<PaginatedResponse<Categoria>> {
  const { q, page, size } = params
  const { data } = await api.get<PaginatedResponse<Categoria>>('/categorias', {
    params: { q: q || undefined, page, size },
  })
  return data
}

export async function createCategoria(payload: CategoriaPayload): Promise<Categoria> {
  const { data } = await api.post<Categoria>('/categorias', payload)
  return data
}

export async function updateCategoria(id: number, payload: CategoriaPayload): Promise<Categoria> {
  const { data } = await api.put<Categoria>(`/categorias/${id}`, payload)
  return data
}

export async function setEstadoCategoria(id: number, activo: boolean): Promise<Categoria> {
  const { data } = await api.patch<Categoria>(`/categorias/${id}/estado`, { activo })
  return data
}
