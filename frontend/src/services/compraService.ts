import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'

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
  proveedor: string
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
  proveedor: string
  items: CompraItemPayload[]
}

export async function listCompras(): Promise<Compra[]> {
  const { data } = await api.get<Compra[]>('/compras')
  return data
}

export async function createCompra(payload: CompraPayload): Promise<Compra> {
  const { data } = await api.post<Compra>('/compras', payload)
  return data
}
