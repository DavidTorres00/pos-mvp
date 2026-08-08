import { useEffect } from 'react'
import { StoreIcon } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

// Selector de sucursal para el admin en pantallas que muestran/mutan stock (Productos,
// Inventario, Compras) — el admin no pertenece a ninguna sucursal, así que debe elegir con cuál
// está trabajando en este momento. El cajero nunca ve este selector: su sucursal_id se usa
// siempre automáticamente en el servidor.
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

  // con 0 o 1 sucursal activa no hay nada real que elegir — el admin de una sola sucursal no
  // necesita ver un selector para una decisión que no existe (ver docs/FRONTEND.md)
  if (sucursales.length <= 1) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-md border bg-accent/40 py-1.5 pr-3 pl-2.5">
      <StoreIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <Label htmlFor="sucursal-activa" className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
          Viendo stock de
        </Label>
        <Select
          value={sucursalId !== null ? String(sucursalId) : ''}
          onValueChange={(value) => setSucursalId(Number(value))}
        >
          <SelectTrigger
            id="sucursal-activa"
            className="h-auto w-44 shrink-0 border-none bg-transparent p-0 font-semibold shadow-none focus-visible:ring-0"
          >
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
    </div>
  )
}
