import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'
import type { Proveedor } from '@/services/proveedorService'
import type { Usuario } from '@/services/usuarioService'
import type { PaginatedResponse } from '@/services/pagination'

export type EstadoOrdenReorden = 'pendiente' | 'aprobada' | 'rechazada' | 'pagada' | 'error'

export interface OrdenReorden {
  id: number
  regla_reorden_id: number
  producto_id: number
  producto: Producto
  proveedor_id: number
  proveedor: Proveedor
  cantidad: number
  monto_estimado: string
  estado: EstadoOrdenReorden
  aprobado_por_id: number | null
  aprobado_por: Usuario | null
  aprobado_at: string | null
  openpay_payment_id: string | null
  error: string | null
  created_at: string
}

export async function listOrdenesReorden(
  params: { estado?: EstadoOrdenReorden; page?: number; size?: number } = {},
): Promise<PaginatedResponse<OrdenReorden>> {
  const { data } = await api.get<PaginatedResponse<OrdenReorden>>('/ordenes-reorden', { params })
  return data
}

export async function rechazarOrdenReorden(id: number): Promise<OrdenReorden> {
  const { data } = await api.post<OrdenReorden>(`/ordenes-reorden/${id}/rechazar`)
  return data
}

export async function aprobarOrdenReorden(id: number): Promise<OrdenReorden> {
  const { data } = await api.post<OrdenReorden>(`/ordenes-reorden/${id}/aprobar`)
  return data
}
