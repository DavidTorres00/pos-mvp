import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'
import type { Proveedor } from '@/services/proveedorService'
import type { PaginatedResponse } from '@/services/pagination'

export interface DetalleCompra {
  id: number
  producto_id: number
  producto: Producto
  cantidad: number
  costo_unitario: string
  subtotal: string
}

export interface Compra {
  id: number
  proveedor_id: number
  proveedor: Proveedor
  total: string
  usuario_id: number
  created_at: string
  items: DetalleCompra[]
}

export interface CompraItemPayload {
  producto_id: number
  cantidad: number
  costo_unitario: number
}

export interface CompraPayload {
  proveedor_id: number
  items: CompraItemPayload[]
}

export interface ListComprasParams {
  page?: number
  size?: number
}

export async function listCompras(params: ListComprasParams = {}): Promise<PaginatedResponse<Compra>> {
  const { page, size } = params
  const { data } = await api.get<PaginatedResponse<Compra>>('/compras', { params: { page, size } })
  return data
}

export async function createCompra(payload: CompraPayload): Promise<Compra> {
  const { data } = await api.post<Compra>('/compras', payload)
  return data
}
