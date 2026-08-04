import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

export interface Usuario {
  id: number
  email: string
  nombre: string
  role: 'admin' | 'cajero'
  activo: boolean
  puede_retirar_excedente: boolean
}

export interface ListUsuariosParams {
  page?: number
  size?: number
}

export interface UsuarioCreatePayload {
  email: string
  nombre: string
  password: string
}

export async function listUsuarios(params: ListUsuariosParams = {}): Promise<PaginatedResponse<Usuario>> {
  const { data } = await api.get<PaginatedResponse<Usuario>>('/usuarios', { params })
  return data
}

export async function createUsuario(payload: UsuarioCreatePayload): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/usuarios', payload)
  return data
}

export async function setPermisoRetiroExcedente(id: number, puede_retirar_excedente: boolean): Promise<Usuario> {
  const { data } = await api.patch<Usuario>(`/usuarios/${id}/permisos`, { puede_retirar_excedente })
  return data
}
