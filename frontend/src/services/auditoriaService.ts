import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'

export interface AuditoriaEvento {
  id: number
  usuario_id: number | null
  usuario: { id: number; email: string; nombre: string; role: 'admin' | 'cajero'; activo: boolean } | null
  accion: string
  entidad: string
  entidad_id: number | null
  detalle: Record<string, unknown> | null
  created_at: string
}

export interface ListAuditoriaParams {
  usuario_id?: number
  entidad?: string
  desde?: string
  hasta?: string
  page?: number
  size?: number
}

export async function listAuditoria(params: ListAuditoriaParams = {}): Promise<PaginatedResponse<AuditoriaEvento>> {
  const { data } = await api.get<PaginatedResponse<AuditoriaEvento>>('/auditoria', { params })
  return data
}
