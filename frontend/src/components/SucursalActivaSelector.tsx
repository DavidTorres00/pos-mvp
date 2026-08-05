import { useEffect } from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

// Selector de sucursal para el admin en pantallas que muestran/mutan stock (Productos,
// Inventario, Compras, Reglas/Órdenes de reorden) — el admin no pertenece a ninguna sucursal,
// así que debe elegir con cuál está trabajando en este momento. El cajero nunca ve este
// selector: su sucursal_id se usa siempre automáticamente en el servidor.
export function SucursalActivaSelector() {
  const { data } = useSucursales('', 1, 100)
  const sucursales = data?.items.filter((sucursal) => sucursal.activo) ?? []
  const sucursalId = useSucursalActivaStore((state) => state.sucursalId)
  const setSucursalId = useSucursalActivaStore((state) => state.setSucursalId)

  const primeraSucursalId = sucursales[0]?.id
  useEffect(() => {
    if (sucursalId === null && primeraSucursalId !== undefined) {
      setSucursalId(primeraSucursalId)
    }
  }, [sucursalId, primeraSucursalId, setSucursalId])

  if (sucursales.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="sucursal-activa" className="sr-only">
        Sucursal
      </Label>
      <Select
        value={sucursalId !== null ? String(sucursalId) : ''}
        onValueChange={(value) => setSucursalId(Number(value))}
      >
        <SelectTrigger id="sucursal-activa" className="w-48 shrink-0">
          <SelectValue placeholder="Sucursal" />
        </SelectTrigger>
        <SelectContent>
          {sucursales.map((sucursal) => (
            <SelectItem key={sucursal.id} value={String(sucursal.id)}>
              {sucursal.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
