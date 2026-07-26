import axios, { isAxiosError } from 'axios'

import { router } from '@/app/routes'
import { useAuthStore } from '@/stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
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
