import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'
import type { PaginatedResponse } from '@/services/pagination'

export type TipoMovimiento = 'entrada' | 'salida'

export interface Movimiento {
  id: number
  producto_id: number
  producto: Producto
  tipo: TipoMovimiento
  cantidad: number
  stock_resultante: number
  motivo: string | null
  created_at: string
}

export interface MovimientoPayload {
  producto_id: number
  tipo: TipoMovimiento
  cantidad: number
  motivo: string | null
}

export interface ListMovimientosParams {
  productoId?: number
  q?: string
  tipo?: TipoMovimiento
  desde?: string
  hasta?: string
  sucursalId?: number | null
  page?: number
  size?: number
}

export async function listMovimientos(params: ListMovimientosParams = {}): Promise<PaginatedResponse<Movimiento>> {
  const { productoId, q, tipo, desde, hasta, sucursalId, page, size } = params
  const { data } = await api.get<PaginatedResponse<Movimiento>>('/inventario/movimientos', {
    params: {
      producto_id: productoId,
      q: q || undefined,
      tipo: tipo || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      sucursal_id: sucursalId ?? undefined,
      page,
      size,
    },
  })
  return data
}

export async function createMovimiento(payload: MovimientoPayload, sucursalId?: number | null): Promise<Movimiento> {
  const { data } = await api.post<Movimiento>('/inventario/movimientos', payload, {
    params: { sucursal_id: sucursalId ?? undefined },
  })
  return data
}
