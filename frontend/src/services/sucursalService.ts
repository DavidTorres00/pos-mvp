import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

export interface Sucursal {
  id: number
  nombre: string
  direccion: string | null
  responsable: string | null
  telefono: string | null
  limite_efectivo_caja: string | null
  activo: boolean
}

export interface SucursalPayload {
  nombre: string
  direccion?: string
  responsable?: string
  telefono?: string
  limite_efectivo_caja?: number
}

export interface ListSucursalesParams {
  q?: string
  page?: number
  size?: number
}

export type EstadoEquipoCaja = 'abierta' | 'excedida' | 'cerrada'

export interface EquipoCajaEstado {
  equipo_id: number
  equipo_nombre: string
  equipo_activo: boolean
  estado: EstadoEquipoCaja
  cajero_usuario_id: number | null
  cajero_nombre: string | null
  monto_esperado: string | null
  limite_efectivo: string | null
  fecha_apertura: string | null
  ultimo_cierre: string | null
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

export async function getCajasDeSucursal(sucursalId: number): Promise<EquipoCajaEstado[]> {
  const { data } = await api.get<EquipoCajaEstado[]>(`/sucursales/${sucursalId}/cajas`)
  return data
}
