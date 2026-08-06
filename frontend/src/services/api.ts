import axios, { isAxiosError } from 'axios'

import { router } from '@/app/routes'
import { esErrorDeRed } from '@/lib/apiError'
import { useAuthStore } from '@/stores/authStore'
import { useServidorStore } from '@/stores/servidorStore'

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
  (response) => {
    // cualquier ciclo HTTP completo — de cualquier query o mutation, esta es la instancia
    // única que usa toda la app — prueba que el servidor está arriba. Solo escribe si hacía
    // falta: `caido` ya es `false` la enorme mayoría de las veces, y esto corre en cada response
    // exitosa de toda la app.
    if (useServidorStore.getState().caido) {
      useServidorStore.getState().marcarDisponible()
    }
    return response
  },
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession()
      router.navigate('/login', { replace: true })
    }
    if (esErrorDeRed(error)) {
      useServidorStore.getState().marcarCaido({
        mensaje: error.message,
        codigo: error.code,
        hora: new Date().toISOString(),
      })
    }
    return Promise.reject(error)
  },
)
