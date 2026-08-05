import { useQuery } from '@tanstack/react-query'

import { getMe } from '@/services/authService'

// mantiene authStore.usuario sincronizado con el servidor mientras la sesión sigue activa: sin
// esto, cambios que un admin hace en vivo (otorgar/quitar puede_retirar_excedente, desactivar
// al usuario) nunca le llegaban a una sesión ya abierta — quedaba con el snapshot del login.
export function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ['auth-me'],
    queryFn: getMe,
    enabled,
    refetchInterval: 30_000,
  })
}
