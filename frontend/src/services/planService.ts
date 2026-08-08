import { api } from '@/services/api'

export interface Plan {
  limite_equipos: number | null
  equipos_activos: number
  updated_at: string
}

export interface PlanPayload {
  limite_equipos?: number
}

export async function getPlan(): Promise<Plan> {
  const { data } = await api.get<Plan>('/superadmin/plan')
  return data
}

export async function updatePlan(payload: PlanPayload): Promise<Plan> {
  const { data } = await api.put<Plan>('/superadmin/plan', payload)
  return data
}
