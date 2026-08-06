import { api } from '@/services/api'

export interface Caja {
  id: number
  usuario_id: number
  usuario_nombre: string
  equipo_id: number
  equipo_nombre: string
  sucursal_nombre: string
  monto_inicial: string
  monto_final: string | null
  abierta: boolean
  fecha_apertura: string
  fecha_cierre: string | null
}

export interface CajaActual {
  caja: Caja | null
  efectivo_actual: string | null
  limite_efectivo: string | null
  excede_limite: boolean
  ultimo_cierre: string | null
}

export interface VoucherRetiro {
  movimiento_id: number
  caja_id: number
  cajero: string
  autorizado_por: string
  sucursal_nombre: string
  equipo_nombre: string
  fecha: string
  monto_retirado: string
  efectivo_anterior: string
  efectivo_resultante: string
  monto_inicial: string
}

export interface CajaResumen {
  caja: Caja
  total_ventas_efectivo: string
  total_ventas_tarjeta: string
  total_ventas_transferencia: string
  total_entradas: string
  total_salidas: string
  monto_esperado: string
  diferencia: string | null
  limite_efectivo: string | null
}

export async function getCajaActual(): Promise<CajaActual> {
  const { data } = await api.get<CajaActual>('/caja/actual')
  return data
}

export async function retirarExcedenteCaja(): Promise<VoucherRetiro> {
  const { data } = await api.post<VoucherRetiro>('/caja/retirar-excedente')
  return data
}

export async function getUltimoRetiroExcedente(): Promise<VoucherRetiro | null> {
  const { data } = await api.get<VoucherRetiro | null>('/caja/ultimo-retiro-excedente')
  return data
}

export async function abrirCaja(equipo_id: number, monto_inicial: number): Promise<Caja> {
  const { data } = await api.post<Caja>('/caja/abrir', { equipo_id, monto_inicial })
  return data
}

export async function cerrarCaja(monto_final: number, motivo_diferencia?: string | null): Promise<CajaResumen> {
  const { data } = await api.post<CajaResumen>('/caja/cerrar', { monto_final, motivo_diferencia })
  return data
}

export async function getResumenCaja(cajaId: number): Promise<CajaResumen> {
  const { data } = await api.get<CajaResumen>(`/caja/${cajaId}/resumen`)
  return data
}
