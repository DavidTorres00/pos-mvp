import { api } from '@/services/api'
import type { Usuario } from '@/stores/authStore'

export interface LoginPayload {
  email: string
  password: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

export async function login(payload: LoginPayload): Promise<{ token: string; usuario: Usuario }> {
  const { data } = await api.post<TokenResponse>('/auth/login', payload)
  const { data: usuario } = await api.get<Usuario>('/auth/me', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  })
  return { token: data.access_token, usuario }
}
