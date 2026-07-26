import { useMutation } from '@tanstack/react-query'

import { login } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import type { LoginFormValues } from '@/features/auth/schemas/loginSchema'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)

  return useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
    onSuccess: (usuario) => setSession(usuario),
  })
}
