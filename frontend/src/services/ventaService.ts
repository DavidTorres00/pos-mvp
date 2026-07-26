import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'

export interface DetalleVenta {
  id: number
  producto_id: number
  producto: Producto
  cantidad: number
  precio_unitario: string
  subtotal: string
}

export interface Venta {
  id: number
  caja_id: number
  usuario_id: number
  total: string
  created_at: string
  items: DetalleVenta[]
}

export interface VentaItemPayload {
  producto_id: number
  cantidad: number
}

export interface VentaPayload {
  items: VentaItemPayload[]
}

export async function listVentas(): Promise<Venta[]> {
  const { data } = await api.get<Venta[]>('/ventas')
  return data
}

export async function createVenta(payload: VentaPayload): Promise<Venta> {
  const { data } = await api.post<Venta>('/ventas', payload)
  return data
}
