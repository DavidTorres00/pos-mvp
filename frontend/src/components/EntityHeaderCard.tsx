import type { ReactNode } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

interface EntityHeaderCardProps {
  nombre: string
  activo: boolean
  infoLines?: ReactNode
  extraActions?: ReactNode
  editLabel?: string
  onEdit: () => void
  onToggleEstado: () => void
  toggleDialogTitle: string
  toggleDialogDescription: string
}

// Shell del header de detalle de un hub maestro-detalle (ver SucursalHeaderCard/CategoriaHeaderCard,
// que lo envuelven con su propio texto/campos) — título + badge "Inactiva" + botón Editar +
// AlertDialog de Activar/Desactivar, siempre igual entre entidades. `infoLines`/`extraActions`
// son los únicos puntos que varían por entidad.
export function EntityHeaderCard({
  nombre,
  activo,
  infoLines,
  extraActions,
  editLabel = 'Editar',
  onEdit,
  onToggleEstado,
  toggleDialogTitle,
  toggleDialogDescription,
}: EntityHeaderCardProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{nombre}</h2>
        {infoLines}
        {!activo && <p className="mt-1 text-sm font-medium text-destructive">Inactiva</p>}
      </div>

      <div className="flex gap-2">
        {extraActions}
        <Button variant="outline" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className={activo ? 'text-destructive' : undefined}>
              {activo ? 'Desactivar' : 'Activar'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{toggleDialogTitle}</AlertDialogTitle>
              <AlertDialogDescription>{toggleDialogDescription}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onToggleEstado}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
