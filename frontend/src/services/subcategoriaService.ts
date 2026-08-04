import { api } from '@/services/api'
import type { Categoria } from '@/services/categoriaService'
import type { PaginatedResponse } from '@/services/pagination'

export interface Subcategoria {
  id: number
  nombre: string
  codigo: string
  activo: boolean
  categoria_id: number
  categoria: Categoria
}

export interface SubcategoriaPayload {
  nombre: string
  categoria_id: number
}

export interface ListSubcategoriasParams {
  categoria_id?: number
  page?: number
  size?: number
}

export async function listSubcategorias(
  params: ListSubcategoriasParams = {},
): Promise<PaginatedResponse<Subcategoria>> {
  const { categoria_id, page, size } = params
  const { data } = await api.get<PaginatedResponse<Subcategoria>>('/subcategorias', {
    params: { categoria_id, page, size },
  })
  return data
}

export async function createSubcategoria(payload: SubcategoriaPayload): Promise<Subcategoria> {
  const { data } = await api.post<Subcategoria>('/subcategorias', payload)
  return data
}

export async function updateSubcategoria(id: number, nombre: string): Promise<Subcategoria> {
  const { data } = await api.put<Subcategoria>(`/subcategorias/${id}`, { nombre })
  return data
}

export async function setEstadoSubcategoria(id: number, activo: boolean): Promise<Subcategoria> {
  const { data } = await api.patch<Subcategoria>(`/subcategorias/${id}/estado`, { activo })
  return data
}
