import { api } from '@/services/api'
import type { CajaResumen } from '@/services/cajaService'

export interface VentasDia {
  fecha: string
  total_ventas: string
  cantidad_ventas: number
}

export async function getVentasDia(): Promise<VentasDia> {
  const { data } = await api.get<VentasDia>('/reportes/ventas-dia')
  return data
}

export async function getReporteCaja(): Promise<CajaResumen> {
  const { data } = await api.get<CajaResumen>('/reportes/caja')
  return data
}
