import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { updatePlan, type PlanPayload } from '@/services/planService'

export function useUpdatePlan() {
  return useApiMutation((payload: PlanPayload) => updatePlan(payload), [['plan']])
}
