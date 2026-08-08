import { api } from '@/services/api'

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
