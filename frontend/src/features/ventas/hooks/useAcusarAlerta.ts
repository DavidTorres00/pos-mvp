import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { acusarAlerta } from '@/services/reporteService'
import type { AlertaTipo } from '@/services/reporteService'

export function useAcusarAlerta() {
  return useApiMutation(
    ({ tipo, referenciaId }: { tipo: AlertaTipo; referenciaId: number }) => acusarAlerta(tipo, referenciaId),
    [['reportes-atencion']],
  )
}
