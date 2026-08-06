import { useApiMutation } from '@/lib/hooks/useApiMutation'
import {
  cerrarCajaDeUsuario,
  createUsuario,
  retirarExcedenteDeUsuario,
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
    ({ id, monto_final, motivo_diferencia }: { id: number; monto_final: number; motivo_diferencia?: string | null }) =>
      cerrarCajaDeUsuario(id, monto_final, motivo_diferencia),
    [['caja-de-usuario'], ['cajas-abiertas'], ['usuarios'], ['sucursal-cajas'], ['resumen-sucursales']],
  )
}

export function useRetirarExcedenteDeUsuario() {
  return useApiMutation(
    (id: number) => retirarExcedenteDeUsuario(id),
    [['caja-de-usuario'], ['cajas-abiertas'], ['auditoria'], ['sucursal-cajas'], ['resumen-sucursales']],
  )
}
