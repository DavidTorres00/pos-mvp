import { useMutation } from '@tanstack/react-query'

import { logout } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)

  return useMutation({
    mutationFn: logout,
    onSettled: () => clearSession(),
  })
}
