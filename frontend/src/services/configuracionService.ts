import { api } from '@/services/api'

export interface ConfiguracionNegocio {
  limite_efectivo_caja: string | null
  openpay_tope_por_orden: string | null
  openpay_tope_diario: string | null
  umbral_stock_bajo_default: number | null
  updated_at: string
}

export interface ConfiguracionNegocioPayload {
  limite_efectivo_caja?: number
  openpay_tope_por_orden?: number
  openpay_tope_diario?: number
  umbral_stock_bajo_default?: number
}

export async function getConfiguracion(): Promise<ConfiguracionNegocio> {
  const { data } = await api.get<ConfiguracionNegocio>('/configuracion')
  return data
}

export async function updateConfiguracion(payload: ConfiguracionNegocioPayload): Promise<ConfiguracionNegocio> {
  const { data } = await api.put<ConfiguracionNegocio>('/configuracion', payload)
  return data
}
