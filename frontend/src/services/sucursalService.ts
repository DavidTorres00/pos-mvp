import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

export interface Sucursal {
  id: number
  nombre: string
  activo: boolean
}

export interface SucursalPayload {
  nombre: string
}

export interface ListSucursalesParams {
  q?: string
  page?: number
  size?: number
}

export async function listSucursales(params: ListSucursalesParams = {}): Promise<PaginatedResponse<Sucursal>> {
  const { q, page, size } = params
  const { data } = await api.get<PaginatedResponse<Sucursal>>('/sucursales', {
    params: { q: q || undefined, page, size },
  })
  return data
}

export async function createSucursal(payload: SucursalPayload): Promise<Sucursal> {
  const { data } = await api.post<Sucursal>('/sucursales', payload)
  return data
}

export async function updateSucursal(id: number, payload: SucursalPayload): Promise<Sucursal> {
  const { data } = await api.put<Sucursal>(`/sucursales/${id}`, payload)
  return data
}

export async function setEstadoSucursal(id: number, activo: boolean): Promise<Sucursal> {
  const { data } = await api.patch<Sucursal>(`/sucursales/${id}/estado`, { activo })
  return data
}
