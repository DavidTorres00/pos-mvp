import { cn } from '@/lib/utils'

interface SucursalTabsProps {
  sucursales: { sucursal_id: number; sucursal_nombre: string }[]
  seleccionada: number | null
  onSeleccionar: (id: number | null) => void
}

function tabClass(active: boolean) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
    active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
  )
}

export function SucursalTabs({ sucursales, seleccionada, onSeleccionar }: SucursalTabsProps) {
  if (sucursales.length === 0) return null

  return (
    <div className="flex w-fit flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1">
      <button type="button" onClick={() => onSeleccionar(null)} className={tabClass(seleccionada === null)}>
        Todas
      </button>
      {sucursales.map((s) => (
        <button
          key={s.sucursal_id}
          type="button"
          onClick={() => onSeleccionar(s.sucursal_id)}
          className={tabClass(seleccionada === s.sucursal_id)}
        >
          {s.sucursal_nombre}
        </button>
      ))}
    </div>
  )
}
