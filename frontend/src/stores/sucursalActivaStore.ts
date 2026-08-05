import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SucursalActivaState {
  sucursalId: number | null
  setSucursalId: (id: number) => void
}

// Sucursal que el admin eligió para trabajar en pantallas de stock (Productos, Inventario,
// Compras, Reglas/Órdenes de reorden). El cajero nunca usa este store: su sucursal_id se
// resuelve siempre en el servidor a partir de su propio usuario.
export const useSucursalActivaStore = create<SucursalActivaState>()(
  persist(
    (set) => ({
      sucursalId: null,
      setSucursalId: (sucursalId) => set({ sucursalId }),
    }),
    { name: 'pos-sucursal-activa' },
  ),
)
