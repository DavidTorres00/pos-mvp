import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Usuario {
  id: number
  email: string
  nombre: string
  activo: boolean
}

interface AuthState {
  token: string | null
  usuario: Usuario | null
  isAuthenticated: () => boolean
  setSession: (token: string, usuario: Usuario) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      usuario: null,
      isAuthenticated: () => get().token !== null,
      setSession: (token, usuario) => set({ token, usuario }),
      clearSession: () => set({ token: null, usuario: null }),
    }),
    { name: 'pos-auth' },
  ),
)
