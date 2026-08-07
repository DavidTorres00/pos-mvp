import { api } from '@/services/api'
import type { CajaResumen } from '@/services/cajaService'

export interface VentasDia {
  fecha: string
  total_ventas: string
  cantidad_ventas: number
}

export interface VentasPorHoraItem {
  hora: number
  total_ventas: string
  cantidad_ventas: number
}

export interface SucursalResumen {
  sucursal_id: number
  sucursal_nombre: string
  ventas_hoy: string
  cantidad_ventas_hoy: number
  efectivo_esperado: string
  cajas_abiertas: number
  equipos_activos: number
  cajas_excedidas: number
}

export type AlertaTipo = 'caja_excedida' | 'caja_sin_cierre' | 'stock_bajo' | 'sin_stock' | 'faltante_caja'

export interface Alerta {
  tipo: AlertaTipo
  titulo: string
  descripcion: string
  sucursal_nombre: string | null
  cantidad: number
  created_at: string | null
  sucursal_id: number | null
  equipo_id: number | null
  auditoria_id: number | null
}

export async function getVentasDia(fecha?: string): Promise<VentasDia> {
  const { data } = await api.get<VentasDia>('/reportes/ventas-dia', { params: fecha ? { fecha } : undefined })
  return data
}

export async function getVentasPorHora(fecha?: string): Promise<VentasPorHoraItem[]> {
  const { data } = await api.get<VentasPorHoraItem[]>('/reportes/ventas-por-hora', {
    params: fecha ? { fecha } : undefined,
  })
  return data
}

export async function getCajasAbiertas(): Promise<CajaResumen[]> {
  const { data } = await api.get<CajaResumen[]>('/reportes/cajas-abiertas')
  return data
}

export async function getResumenSucursales(): Promise<SucursalResumen[]> {
  const { data } = await api.get<SucursalResumen[]>('/reportes/resumen-sucursales')
  return data
}

export async function getAtencion(): Promise<Alerta[]> {
  const { data } = await api.get<Alerta[]>('/reportes/atencion')
  return data
}

// solo alertas basadas en un hecho histórico inmutable aceptan esto (hoy solo faltante_caja,
// ver docs/BACKEND.md) — el backend rechaza cualquier otro tipo con 400
export async function acusarAlerta(tipo: AlertaTipo, referenciaId: number): Promise<void> {
  await api.post('/reportes/atencion/acuse', { tipo, referencia_id: referenciaId })
}
