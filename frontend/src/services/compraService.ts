import { api } from '@/services/api'
import type { Producto } from '@/services/productoService'
import type { Proveedor } from '@/services/proveedorService'
import type { PaginatedResponse } from '@/services/pagination'
import type { Sucursal } from '@/services/sucursalService'

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
  sucursal_id: number
  sucursal: Sucursal
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
  sucursalId?: number | null
  page?: number
  size?: number
}

export async function listCompras(params: ListComprasParams = {}): Promise<PaginatedResponse<Compra>> {
  const { sucursalId, page, size } = params
  const { data } = await api.get<PaginatedResponse<Compra>>('/compras', {
    params: { sucursal_id: sucursalId ?? undefined, page, size },
  })
  return data
}

export async function createCompra(payload: CompraPayload, sucursalId?: number | null): Promise<Compra> {
  const { data } = await api.post<Compra>('/compras', payload, { params: { sucursal_id: sucursalId ?? undefined } })
  return data
}
