import { useQuery } from '@tanstack/react-query'

import { getCajaDeUsuario } from '@/services/usuarioService'

export function useCajaDeUsuario(usuarioId: number | undefined) {
  return useQuery({
    queryKey: ['caja-de-usuario', usuarioId],
    queryFn: () => getCajaDeUsuario(usuarioId as number),
    enabled: usuarioId !== undefined,
  })
}
