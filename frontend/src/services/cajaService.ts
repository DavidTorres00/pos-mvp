import { api } from '@/services/api'

export type TipoMovimientoCaja = 'entrada' | 'salida'

export interface Caja {
  id: number
  usuario_id: number
  monto_inicial: string
  monto_final: string | null
  abierta: boolean
  fecha_apertura: string
  fecha_cierre: string | null
}

export interface MovimientoCaja {
  id: number
  caja_id: number
  tipo: TipoMovimientoCaja
  monto: string
  motivo: string | null
  created_at: string
}

export interface CajaResumen {
  caja: Caja
  total_ventas_efectivo: string
  total_entradas: string
  total_salidas: string
  monto_esperado: string
  diferencia: string | null
}

export interface MovimientoCajaPayload {
  tipo: TipoMovimientoCaja
  monto: number
  motivo: string | null
}

export async function getCajaActual(): Promise<Caja | null> {
  const { data } = await api.get<Caja | null>('/caja/actual')
  return data
}

export async function abrirCaja(monto_inicial: number): Promise<Caja> {
  const { data } = await api.post<Caja>('/caja/abrir', { monto_inicial })
  return data
}

export async function cerrarCaja(monto_final: number): Promise<CajaResumen> {
  const { data } = await api.post<CajaResumen>('/caja/cerrar', { monto_final })
  return data
}

export async function crearMovimientoCaja(payload: MovimientoCajaPayload): Promise<MovimientoCaja> {
  const { data } = await api.post<MovimientoCaja>('/caja/movimientos', payload)
  return data
}

export async function listMovimientosCaja(cajaId: number): Promise<MovimientoCaja[]> {
  const { data } = await api.get<MovimientoCaja[]>('/caja/movimientos', { params: { caja_id: cajaId } })
  return data
}

export async function getResumenCaja(cajaId: number): Promise<CajaResumen> {
  const { data } = await api.get<CajaResumen>(`/caja/${cajaId}/resumen`)
  return data
}
