import { api } from '@/services/api'
import type { CajaResumen } from '@/services/cajaService'

export interface VentasDia {
  fecha: string
  total_ventas: string
  cantidad_ventas: number
}

export async function getVentasDia(fecha?: string): Promise<VentasDia> {
  const { data } = await api.get<VentasDia>('/reportes/ventas-dia', { params: fecha ? { fecha } : undefined })
  return data
}

export async function getReporteCaja(): Promise<CajaResumen> {
  const { data } = await api.get<CajaResumen>('/reportes/caja')
  return data
}
