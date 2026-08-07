import { api } from '@/services/api'
import type { PaginatedResponse } from '@/services/pagination'
import type { Producto } from '@/services/productoService'
import type { Proveedor } from '@/services/proveedorService'
import type { Sucursal } from '@/services/sucursalService'
import type { Usuario } from '@/services/usuarioService'

export type EstadoCompra = 'pendiente' | 'pagada' | 'error' | 'rechazada' | 'recibida'

export interface DetalleCompra {
  id: number
  producto_id: number
  producto: Producto
  cantidad: number
  costo_unitario: string
  subtotal: string
  cantidad_recibida: number | null
}

// Pedido a un proveedor — armado y aprobado siempre a mano por el admin, nunca disparado por el
// sistema. Ciclo: pendiente -> pagada/error (Aprobar y pagar) o rechazada (cancelar antes de
// pagar) -> recibida (la mercancía llega a la sucursal, ahí se suma a Inventario). Ver
// docs/BACKEND.md.
export interface Compra {
  id: number
  proveedor_id: number
  proveedor: Proveedor
  sucursal_id: number
  sucursal: Sucursal
  total: string
  usuario_id: number
  usuario: Usuario
  estado: EstadoCompra
  aprobado_por_id: number | null
  aprobado_por: Usuario | null
  aprobado_at: string | null
  openpay_payment_id: string | null
  error: string | null
  recibido_por_id: number | null
  recibido_por: Usuario | null
  recibido_at: string | null
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

export interface RecibirCompraItemPayload {
  producto_id: number
  cantidad_recibida: number
}

export interface ListComprasParams {
  sucursalId?: number | null
  proveedorId?: number | null
  page?: number
  size?: number
}

export async function listCompras(params: ListComprasParams = {}): Promise<PaginatedResponse<Compra>> {
  const { sucursalId, proveedorId, page, size } = params
  const { data } = await api.get<PaginatedResponse<Compra>>('/compras', {
    params: { sucursal_id: sucursalId ?? undefined, proveedor_id: proveedorId ?? undefined, page, size },
  })
  return data
}

export async function createCompra(payload: CompraPayload, sucursalId?: number | null): Promise<Compra> {
  const { data } = await api.post<Compra>('/compras', payload, { params: { sucursal_id: sucursalId ?? undefined } })
  return data
}

export async function aprobarCompra(id: number): Promise<Compra> {
  const { data } = await api.post<Compra>(`/compras/${id}/aprobar`)
  return data
}

export async function rechazarCompra(id: number): Promise<Compra> {
  const { data } = await api.post<Compra>(`/compras/${id}/rechazar`)
  return data
}

export async function recibirCompra(id: number, items: RecibirCompraItemPayload[]): Promise<Compra> {
  const { data } = await api.post<Compra>(`/compras/${id}/recibir`, { items })
  return data
}
