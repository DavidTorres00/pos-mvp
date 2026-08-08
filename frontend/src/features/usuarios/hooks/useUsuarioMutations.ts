import { useApiMutation } from '@/lib/hooks/useApiMutation'
import {
  cerrarCajaDeUsuario,
  createUsuario,
  resetearPasswordUsuario,
  retirarExcedenteDeUsuario,
  setPermisoDevoluciones,
  setPermisoRetiroExcedente,
  updateUsuario,
  type UsuarioCreatePayload,
  type UsuarioUpdatePayload,
} from '@/services/usuarioService'

export function useSetPermisoRetiroExcedente() {
  return useApiMutation(
    ({ id, puede_retirar_excedente }: { id: number; puede_retirar_excedente: boolean }) =>
      setPermisoRetiroExcedente(id, puede_retirar_excedente),
    [['usuarios']],
  )
}

export function useSetPermisoDevoluciones() {
  return useApiMutation(
    ({ id, puede_hacer_devoluciones }: { id: number; puede_hacer_devoluciones: boolean }) =>
      setPermisoDevoluciones(id, puede_hacer_devoluciones),
    [['usuarios']],
  )
}

export function useActualizarUsuario() {
  return useApiMutation(
    ({ id, ...payload }: { id: number } & UsuarioUpdatePayload) => updateUsuario(id, payload),
    [['usuarios']],
  )
}

export function useResetearPasswordUsuario() {
  return useApiMutation(({ id, password }: { id: number; password: string }) => resetearPasswordUsuario(id, password), [['usuarios']])
}

export function useCrearUsuario() {
  return useApiMutation((payload: UsuarioCreatePayload) => createUsuario(payload), [['usuarios']])
}

export function useCerrarCajaDeUsuario() {
  return useApiMutation(
    ({ id, monto_final, motivo_diferencia }: { id: number; monto_final: number; motivo_diferencia?: string | null }) =>
      cerrarCajaDeUsuario(id, monto_final, motivo_diferencia),
    [['caja-de-usuario'], ['usuarios'], ['sucursal-cajas'], ['resumen-sucursales']],
  )
}

export function useRetirarExcedenteDeUsuario() {
  return useApiMutation(
    (id: number) => retirarExcedenteDeUsuario(id),
    [['caja-de-usuario'], ['auditoria'], ['sucursal-cajas'], ['resumen-sucursales']],
  )
}
