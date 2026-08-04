import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

export interface Proveedor {
  id: number
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  clabe: string | null
  activo: boolean
}

export interface ProveedorPayload {
  nombre: string
  contacto?: string | null
  telefono?: string | null
  email?: string | null
  clabe?: string | null
}

export interface ListProveedoresParams {
  q?: string
  page?: number
  size?: number
}

export async function listProveedores(params: ListProveedoresParams = {}): Promise<PaginatedResponse<Proveedor>> {
  const { q, page, size } = params
  const { data } = await api.get<PaginatedResponse<Proveedor>>('/proveedores', {
    params: { q: q || undefined, page, size },
  })
  return data
}

export async function createProveedor(payload: ProveedorPayload): Promise<Proveedor> {
  const { data } = await api.post<Proveedor>('/proveedores', payload)
  return data
}

export async function updateProveedor(id: number, payload: ProveedorPayload): Promise<Proveedor> {
  const { data } = await api.put<Proveedor>(`/proveedores/${id}`, payload)
  return data
}

export async function setEstadoProveedor(id: number, activo: boolean): Promise<Proveedor> {
  const { data } = await api.patch<Proveedor>(`/proveedores/${id}/estado`, { activo })
  return data
}
