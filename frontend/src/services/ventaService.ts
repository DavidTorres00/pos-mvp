import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'
import type { PaginatedResponse } from '@/services/pagination'

export interface DetalleVenta {
  id: number
  producto_id: number
  producto: Producto
  cantidad: number
  precio_unitario: string
  subtotal: string
}

export type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia'

export interface Venta {
  id: number
  caja_id: number
  usuario_id: number
  total: string
  forma_pago: FormaPago
  created_at: string
  items: DetalleVenta[]
}

export interface VentaItemPayload {
  producto_id: number
  cantidad: number
}

export interface VentaPayload {
  items: VentaItemPayload[]
  forma_pago: FormaPago
}

export interface ListVentasParams {
  page?: number
  size?: number
}

export async function listVentas(params: ListVentasParams = {}): Promise<PaginatedResponse<Venta>> {
  const { page, size } = params
  const { data } = await api.get<PaginatedResponse<Venta>>('/ventas', { params: { page, size } })
  return data
}

export async function createVenta(payload: VentaPayload): Promise<Venta> {
  const { data } = await api.post<Venta>('/ventas', payload)
  return data
}
