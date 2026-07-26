import { api } from '@/services/api'
import type { Usuario } from '@/stores/authStore'

export interface LoginPayload {
  email: string
  password: string
}

export async function login(payload: LoginPayload): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/login', payload)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
