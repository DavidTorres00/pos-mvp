import { useApiMutation } from '@/lib/hooks/useApiMutation'
import { useOptimisticToggle } from '@/lib/hooks/useOptimisticToggle'
import { createProveedor, setEstadoProveedor, updateProveedor } from '@/services/proveedorService'
import type { Proveedor, ProveedorPayload } from '@/services/proveedorService'

export function useCrearProveedor() {
  return useApiMutation((payload: ProveedorPayload) => createProveedor(payload), [['proveedores']])
}

export function useUpdateProveedor() {
  return useApiMutation(
    ({ id, payload }: { id: number; payload: ProveedorPayload }) => updateProveedor(id, payload),
    [['proveedores']],
  )
}

export function useSetEstadoProveedor() {
  return useOptimisticToggle<Proveedor>(['proveedores'], ({ id, activo }) => setEstadoProveedor(id, activo))
}
