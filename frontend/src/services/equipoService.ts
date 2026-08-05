import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'
import type { Sucursal } from '@/services/sucursalService'

export interface Equipo {
  id: number
  nombre: string
  activo: boolean
  sucursal_id: number
  sucursal: Sucursal
}

export interface EquipoPayload {
  nombre: string
  sucursal_id: number
}

export interface ListEquiposParams {
  sucursal_id?: number
  page?: number
  size?: number
}

export async function listEquipos(params: ListEquiposParams = {}): Promise<PaginatedResponse<Equipo>> {
  const { sucursal_id, page, size } = params
  const { data } = await api.get<PaginatedResponse<Equipo>>('/equipos', { params: { sucursal_id, page, size } })
  return data
}

export async function createEquipo(payload: EquipoPayload): Promise<Equipo> {
  const { data } = await api.post<Equipo>('/equipos', payload)
  return data
}

export async function updateEquipo(id: number, nombre: string): Promise<Equipo> {
  const { data } = await api.put<Equipo>(`/equipos/${id}`, { nombre })
  return data
}

export async function setEstadoEquipo(id: number, activo: boolean): Promise<Equipo> {
  const { data } = await api.patch<Equipo>(`/equipos/${id}/estado`, { activo })
  return data
}

export async function getEquiposDisponibles(): Promise<Equipo[]> {
  const { data } = await api.get<Equipo[]>('/caja/equipos-disponibles')
  return data
}
