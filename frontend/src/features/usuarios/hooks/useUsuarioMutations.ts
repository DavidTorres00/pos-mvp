import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { createUsuario, setPermisoRetiroExcedente, type UsuarioCreatePayload } from '@/services/usuarioService'

export function useSetPermisoRetiroExcedente() {
  return useApiMutation(
    ({ id, puede_retirar_excedente }: { id: number; puede_retirar_excedente: boolean }) =>
      setPermisoRetiroExcedente(id, puede_retirar_excedente),
    [['usuarios']],
  )
}

export function useCrearUsuario() {
  return useApiMutation((payload: UsuarioCreatePayload) => createUsuario(payload), [['usuarios']])
}
