import { api } from '@/services/api'

export interface Categoria {
  id: number
  nombre: string
  activo: boolean
}

export interface CategoriaPayload {
  nombre: string
}

export async function listCategorias(q?: string): Promise<Categoria[]> {
  const { data } = await api.get<Categoria[]>('/categorias', { params: q ? { q } : undefined })
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
