import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'

export type TipoMovimiento = 'entrada' | 'salida'

export interface Movimiento {
  id: number
  producto_id: number
  producto: Producto
  tipo: TipoMovimiento
  cantidad: number
  motivo: string | null
  created_at: string
}

export interface MovimientoPayload {
  producto_id: number
  tipo: TipoMovimiento
  cantidad: number
  motivo: string | null
}

export async function listMovimientos(productoId?: number): Promise<Movimiento[]> {
  const { data } = await api.get<Movimiento[]>('/inventario/movimientos', {
    params: productoId ? { producto_id: productoId } : undefined,
  })
  return data
}

export async function createMovimiento(payload: MovimientoPayload): Promise<Movimiento> {
  const { data } = await api.post<Movimiento>('/inventario/movimientos', payload)
  return data
}
