import axios, { isAxiosError } from 'axios'

import { router } from '@/app/routes'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
})

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : undefined
}

api.interceptors.request.use((config) => {
  const csrfToken = readCookie('csrf_token')
  if (csrfToken) {
    config.headers.set('X-CSRF-Token', csrfToken)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession()
      router.navigate('/login', { replace: true })
    }
    return Promise.reject(error)
  },
)
