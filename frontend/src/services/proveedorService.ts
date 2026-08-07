import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

// Catálogo puro — es el que va embebido en Producto.proveedor/Compra.proveedor. Sin conteos:
// esos endpoints nunca los calculan.
export interface Proveedor {
  id: number
  nombre: string
  contacto: string | null
  telefono: string | null
  email: string | null
  clabe: string | null
  activo: boolean
}

// Proveedor + conteos — lo que devuelven todos los endpoints de /proveedores (hub de
// Proveedores, ver docs/FRONTEND.md). Mismo split que CategoriaResumen sobre Categoria.
export interface ProveedorResumen extends Proveedor {
  total_productos: number
  pedidos_pendientes: number
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

export async function listProveedores(
  params: ListProveedoresParams = {},
): Promise<PaginatedResponse<ProveedorResumen>> {
  const { q, page, size } = params
  const { data } = await api.get<PaginatedResponse<ProveedorResumen>>('/proveedores', {
    params: { q: q || undefined, page, size },
  })
  return data
}

export async function createProveedor(payload: ProveedorPayload): Promise<ProveedorResumen> {
  const { data } = await api.post<ProveedorResumen>('/proveedores', payload)
  return data
}

export async function updateProveedor(id: number, payload: ProveedorPayload): Promise<ProveedorResumen> {
  const { data } = await api.put<ProveedorResumen>(`/proveedores/${id}`, payload)
  return data
}

export async function setEstadoProveedor(id: number, activo: boolean): Promise<ProveedorResumen> {
  const { data } = await api.patch<ProveedorResumen>(`/proveedores/${id}/estado`, { activo })
  return data
}
