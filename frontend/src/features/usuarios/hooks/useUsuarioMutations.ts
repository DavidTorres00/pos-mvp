import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { setPermisoRetiroExcedente } from '@/services/usuarioService'

export function useSetPermisoRetiroExcedente() {
  return useApiMutation(
    ({ id, puede_retirar_excedente }: { id: number; puede_retirar_excedente: boolean }) =>
      setPermisoRetiroExcedente(id, puede_retirar_excedente),
    [['usuarios']],
  )
}
