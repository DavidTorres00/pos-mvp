import { api } from '@/services/api'
import type { CajaActual, CajaResumen, VoucherRetiro } from '@/services/cajaService'
import type { PaginatedResponse } from '@/services/pagination'

export interface Usuario {
  id: number
  email: string
  nombre: string
  role: 'admin' | 'cajero'
  activo: boolean
  puede_retirar_excedente: boolean
  sucursal_id: number | null
  sucursal_nombre: string | null
  caja_activa: boolean
}

export interface ListUsuariosParams {
  page?: number
  size?: number
}

export interface UsuarioCreatePayload {
  email: string
  nombre: string
  password: string
  sucursal_id: number
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

export async function getCajaDeUsuario(id: number): Promise<CajaActual> {
  const { data } = await api.get<CajaActual>(`/usuarios/${id}/caja`)
  return data
}

export async function cerrarCajaDeUsuario(id: number, monto_final: number): Promise<CajaResumen> {
  const { data } = await api.post<CajaResumen>(`/usuarios/${id}/caja/cerrar`, { monto_final })
  return data
}

export async function retirarExcedenteDeUsuario(id: number): Promise<VoucherRetiro> {
  const { data } = await api.post<VoucherRetiro>(`/usuarios/${id}/caja/retirar-excedente`)
  return data
}
