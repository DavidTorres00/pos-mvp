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
  costo_unitario: string | null
  utilidad: string | null
}

export type FormaPago = 'efectivo' | 'tarjeta' | 'transferencia'

export const FORMA_PAGO_LABELS: Record<FormaPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
}

export type EstadoVenta = 'completada' | 'cancelada'

export interface Venta {
  id: number
  caja_id: number
  usuario_id: number
  usuario_nombre: string
  total: string
  forma_pago: FormaPago
  estado: EstadoVenta
  created_at: string
  sucursal_nombre: string
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
  desde?: string
  hasta?: string
  formaPago?: FormaPago
  sucursalId?: number
  usuarioId?: number
  page?: number
  size?: number
}

export async function listVentas(params: ListVentasParams = {}): Promise<PaginatedResponse<Venta>> {
  const { desde, hasta, formaPago, sucursalId, usuarioId, page, size } = params
  const { data } = await api.get<PaginatedResponse<Venta>>('/ventas', {
    params: {
      desde: desde || undefined,
      hasta: hasta || undefined,
      forma_pago: formaPago || undefined,
      sucursal_id: sucursalId ?? undefined,
      usuario_id: usuarioId ?? undefined,
      page,
      size,
    },
  })
  return data
}

export interface VentaResumen {
  total_monto: string
  total_neto: string
  cantidad: number
  total_articulos: number
  utilidad_total: string
  margen_pct: string | null
  articulos_con_costo: number
  devoluciones_monto: string
  devoluciones_cantidad: number
  cancelaciones_monto: string
  cancelaciones_cantidad: number
}

export type ResumenVentasParams = Omit<ListVentasParams, 'page' | 'size'>

export async function getResumenVentas(params: ResumenVentasParams = {}): Promise<VentaResumen> {
  const { desde, hasta, formaPago, sucursalId, usuarioId } = params
  const { data } = await api.get<VentaResumen>('/ventas/resumen', {
    params: {
      desde: desde || undefined,
      hasta: hasta || undefined,
      forma_pago: formaPago || undefined,
      sucursal_id: sucursalId ?? undefined,
      usuario_id: usuarioId ?? undefined,
    },
  })
  return data
}

export interface ProductoVenta {
  producto_id: number
  producto_nombre: string
  cantidad: number
  total_vendido: string
}

export interface MasVendidosParams extends ResumenVentasParams {
  limite?: number
}

export async function getMasVendidos(params: MasVendidosParams = {}): Promise<ProductoVenta[]> {
  const { desde, hasta, formaPago, sucursalId, usuarioId, limite } = params
  const { data } = await api.get<ProductoVenta[]>('/ventas/mas-vendidos', {
    params: {
      desde: desde || undefined,
      hasta: hasta || undefined,
      forma_pago: formaPago || undefined,
      sucursal_id: sucursalId ?? undefined,
      usuario_id: usuarioId ?? undefined,
      limite,
    },
  })
  return data
}

export interface VentaPorDia {
  fecha: string
  total_monto: string
  cantidad: number
}

export async function getVentasPorDia(params: ResumenVentasParams = {}): Promise<VentaPorDia[]> {
  const { desde, hasta, formaPago, sucursalId, usuarioId } = params
  const { data } = await api.get<VentaPorDia[]>('/ventas/por-dia', {
    params: {
      desde: desde || undefined,
      hasta: hasta || undefined,
      forma_pago: formaPago || undefined,
      sucursal_id: sucursalId ?? undefined,
      usuario_id: usuarioId ?? undefined,
    },
  })
  return data
}

export interface VentaPorSucursal {
  sucursal_id: number
  sucursal_nombre: string
  total_monto: string
  utilidad_total: string
  cantidad: number
}

// sin sucursal_id: la ranking agrupa precisamente por eso
export type PorSucursalParams = Omit<ResumenVentasParams, 'sucursalId'>

export async function getVentasPorSucursal(params: PorSucursalParams = {}): Promise<VentaPorSucursal[]> {
  const { desde, hasta, formaPago, usuarioId } = params
  const { data } = await api.get<VentaPorSucursal[]>('/ventas/por-sucursal', {
    params: {
      desde: desde || undefined,
      hasta: hasta || undefined,
      forma_pago: formaPago || undefined,
      usuario_id: usuarioId ?? undefined,
    },
  })
  return data
}

export async function createVenta(payload: VentaPayload): Promise<Venta> {
  const { data } = await api.post<Venta>('/ventas', payload)
  return data
}

export async function getVenta(ventaId: number): Promise<Venta> {
  const { data } = await api.get<Venta>(`/ventas/${ventaId}`)
  return data
}

export interface DetalleDevolucion {
  id: number
  detalle_venta_id: number
  producto_id: number
  producto_nombre: string
  cantidad: number
  subtotal: string
}

export interface Devolucion {
  id: number
  venta_id: number
  actor_id: number
  actor_nombre: string
  motivo: string
  monto_total: string
  movimiento_caja_id: number | null
  created_at: string
  items: DetalleDevolucion[]
}

export interface DevolucionItemPayload {
  detalle_venta_id: number
  cantidad: number
}

export interface DevolucionPayload {
  items: DevolucionItemPayload[]
  motivo: string
}

export async function crearDevolucion(ventaId: number, payload: DevolucionPayload): Promise<Devolucion> {
  const { data } = await api.post<Devolucion>(`/ventas/${ventaId}/devoluciones`, payload)
  return data
}

export async function listDevoluciones(ventaId: number): Promise<Devolucion[]> {
  const { data } = await api.get<Devolucion[]>(`/ventas/${ventaId}/devoluciones`)
  return data
}

export interface Cancelacion {
  id: number
  venta_id: number
  actor_id: number
  actor_nombre: string
  motivo: string
  monto_total: string
  movimiento_caja_id: number | null
  created_at: string
}

export interface CancelacionPayload {
  motivo: string
}

export async function crearCancelacion(ventaId: number, payload: CancelacionPayload): Promise<Cancelacion> {
  const { data } = await api.post<Cancelacion>(`/ventas/${ventaId}/cancelacion`, payload)
  return data
}

export async function getCancelacion(ventaId: number): Promise<Cancelacion | null> {
  const { data } = await api.get<Cancelacion | null>(`/ventas/${ventaId}/cancelacion`)
  return data
}
