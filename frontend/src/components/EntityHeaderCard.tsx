import type { ReactNode } from 'react'

interface EntityHeaderCardProps {
  nombre: string
  activo: boolean
  infoLines?: ReactNode
  // contenido siempre visible a la derecha, antes de `actions` (p. ej. el selector de sucursal
  // en CategoriaHeaderCard)
  sideContent?: ReactNode
  // acciones sobre la entidad (p. ej. `<EntityActionsMenu>`) — opcional: un hub puede no
  // necesitar ninguna aquí si ya vive en cada fila de su `MasterListAside` (ver CategoriaHeaderCard)
  actions?: ReactNode
}

// Shell del header de detalle de un hub maestro-detalle (ver SucursalHeaderCard/CategoriaHeaderCard,
// que lo envuelven con su propio texto/campos) — título + badge "Inactiva" a la izquierda,
// `sideContent`/`actions` a la derecha. Solo resuelve el layout común; qué va en cada slot lo
// decide cada entidad.
export function EntityHeaderCard({ nombre, activo, infoLines, sideContent, actions }: EntityHeaderCardProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{nombre}</h2>
        {infoLines}
        {!activo && <p className="mt-1 text-sm font-medium text-destructive">Inactiva</p>}
      </div>

      <div className="flex items-center gap-2">
        {sideContent}
        {actions}
      </div>
    </div>
  )
}
