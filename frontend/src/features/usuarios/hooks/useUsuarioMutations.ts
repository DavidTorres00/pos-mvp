import { useApiMutation } from '@/lib/hooks/useApiMutation'
import {
  cerrarCajaDeUsuario,
  createUsuario,
  setPermisoRetiroExcedente,
  type UsuarioCreatePayload,
} from '@/services/usuarioService'

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

export function useCerrarCajaDeUsuario() {
  return useApiMutation(
    ({ id, monto_final }: { id: number; monto_final: number }) => cerrarCajaDeUsuario(id, monto_final),
    [['caja-de-usuario'], ['cajas-abiertas'], ['usuarios']],
  )
}
