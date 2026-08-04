import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Usuario {
  id: number
  email: string
  nombre: string
  activo: boolean
  role: 'admin' | 'cajero'
  puede_retirar_excedente: boolean
}

interface AuthState {
  usuario: Usuario | null
  isAuthenticated: () => boolean
  setSession: (usuario: Usuario) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      isAuthenticated: () => get().usuario !== null,
      setSession: (usuario) => set({ usuario }),
      clearSession: () => set({ usuario: null }),
    }),
    { name: 'pos-auth' },
  ),
)
