import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { updateConfiguracion, type ConfiguracionNegocioPayload } from '@/services/configuracionService'

export function useUpdateConfiguracion() {
  return useApiMutation(
    (payload: ConfiguracionNegocioPayload) => updateConfiguracion(payload),
    [['configuracion-negocio']],
  )
}
