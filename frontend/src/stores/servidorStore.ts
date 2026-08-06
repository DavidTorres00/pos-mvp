import { create } from 'zustand'

export interface ErrorDeRed {
  mensaje: string
  codigo?: string
  hora: string
}

// estado transitorio de conectividad (ver services/api.ts) — deliberadamente sin `persist`,
// un reload siempre debe volver a comprobar en vivo, no arrancar con la bandera de una sesión
// anterior
interface ServidorState {
  caido: boolean
  ultimoError: ErrorDeRed | null
  marcarCaido: (error: ErrorDeRed) => void
  marcarDisponible: () => void
}

export const useServidorStore = create<ServidorState>((set) => ({
  caido: false,
  ultimoError: null,
  marcarCaido: (error) => set({ caido: true, ultimoError: error }),
  marcarDisponible: () => set({ caido: false }),
}))
