import { ErrorState, LoadingState } from '@/components/DataStates'
import { ConfiguracionForm } from '@/features/configuracion/components/ConfiguracionForm'
import { useConfiguracion } from '@/features/configuracion/hooks/useConfiguracion'
import { useUpdateConfiguracion } from '@/features/configuracion/hooks/useConfiguracionMutations'
import type { ConfiguracionFormValues } from '@/features/configuracion/schemas/configuracionSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import type { ConfiguracionNegocioPayload } from '@/services/configuracionService'
import { useAuthStore } from '@/stores/authStore'

function toInputValue(value: string | null | undefined): string | undefined {
  return value ?? undefined
}

function toPayload(values: ConfiguracionFormValues): ConfiguracionNegocioPayload {
  return {
    limite_efectivo_caja: values.limite_efectivo_caja ? Number(values.limite_efectivo_caja) : undefined,
    openpay_tope_por_orden: values.openpay_tope_por_orden ? Number(values.openpay_tope_por_orden) : undefined,
    openpay_tope_diario: values.openpay_tope_diario ? Number(values.openpay_tope_diario) : undefined,
  }
}

export function ConfiguracionPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const { data, isLoading, isError } = useConfiguracion(isAdmin)
  const update = useUpdateConfiguracion()

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  function handleSubmit(values: ConfiguracionFormValues) {
    update.mutate(toPayload(values))
  }

  return (
    <div className="flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Configuración del negocio</h1>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : (
        <ConfiguracionForm
          key={data?.updated_at}
          defaultValues={{
            limite_efectivo_caja: toInputValue(data?.limite_efectivo_caja),
            openpay_tope_por_orden: toInputValue(data?.openpay_tope_por_orden),
            openpay_tope_diario: toInputValue(data?.openpay_tope_diario),
          }}
          isPending={update.isPending}
          errorMessage={update.isError ? getApiErrorMessage(update.error, 'No se pudo guardar la configuración') : undefined}
          onSubmit={handleSubmit}
        />
      )}

      {update.isSuccess && <p className="text-sm text-success">Configuración guardada.</p>}
    </div>
  )
}
