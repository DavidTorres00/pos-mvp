import { ErrorState, LoadingState } from '@/components/DataStates'
import { StatCard } from '@/components/StatCard'
import { PlanForm } from '@/features/plan/components/PlanForm'
import { usePlan } from '@/features/plan/hooks/usePlan'
import { useUpdatePlan } from '@/features/plan/hooks/usePlanMutations'
import type { PlanFormValues } from '@/features/plan/schemas/planSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import type { PlanPayload } from '@/services/planService'

function toPayload(values: PlanFormValues): PlanPayload {
  return {
    limite_equipos: values.limite_equipos ? Number(values.limite_equipos) : undefined,
  }
}

export function PlanPage() {
  const { data, isLoading, isError } = usePlan(true)
  const update = useUpdatePlan()

  function handleSubmit(values: PlanFormValues) {
    update.mutate(toPayload(values))
  }

  return (
    <div className="flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Plan de esta instalación</h1>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : (
        <>
          <StatCard label="Equipos activos" value={String(data?.equipos_activos ?? 0)} />

          <PlanForm
            key={data?.updated_at}
            defaultValues={{
              limite_equipos: data?.limite_equipos != null ? String(data.limite_equipos) : undefined,
            }}
            isPending={update.isPending}
            errorMessage={update.isError ? getApiErrorMessage(update.error, 'No se pudo guardar el plan') : undefined}
            onSubmit={handleSubmit}
          />
        </>
      )}

      {update.isSuccess && <p className="text-sm text-success">Plan actualizado.</p>}
    </div>
  )
}
