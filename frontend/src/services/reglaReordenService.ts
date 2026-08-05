import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'
import type { Proveedor } from '@/services/proveedorService'
import type { PaginatedResponse } from '@/services/pagination'
import type { Sucursal } from '@/services/sucursalService'

export interface ReglaReorden {
  id: number
  producto_id: number
  producto: Producto
  sucursal_id: number
  sucursal: Sucursal
  proveedor_id: number
  proveedor: Proveedor
  umbral_stock: number
  cantidad_pedido: number
  costo_unitario_estimado: string
  activo: boolean
  created_at: string
}

export interface ReglaReordenPayload {
  producto_id: number
  proveedor_id: number
  umbral_stock: number
  cantidad_pedido: number
  costo_unitario_estimado: number
}

export async function listReglasReorden(
  params: { sucursalId?: number | null; page?: number; size?: number } = {},
): Promise<PaginatedResponse<ReglaReorden>> {
  const { sucursalId, page, size } = params
  const { data } = await api.get<PaginatedResponse<ReglaReorden>>('/reglas-reorden', {
    params: { sucursal_id: sucursalId ?? undefined, page, size },
  })
  return data
}

export async function createReglaReorden(
  payload: ReglaReordenPayload,
  sucursalId?: number | null,
): Promise<ReglaReorden> {
  const { data } = await api.post<ReglaReorden>('/reglas-reorden', payload, {
    params: { sucursal_id: sucursalId ?? undefined },
  })
  return data
}

export async function updateReglaReorden(
  id: number,
  payload: Omit<ReglaReordenPayload, 'producto_id'>,
): Promise<ReglaReorden> {
  const { data } = await api.put<ReglaReorden>(`/reglas-reorden/${id}`, payload)
  return data
}

export async function setEstadoReglaReorden(id: number, activo: boolean): Promise<ReglaReorden> {
  const { data } = await api.patch<ReglaReorden>(`/reglas-reorden/${id}/estado`, { activo })
  return data
}
