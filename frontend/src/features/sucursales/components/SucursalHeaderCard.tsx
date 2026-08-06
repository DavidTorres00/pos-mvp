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
import type { Sucursal } from '@/services/sucursalService'

interface SucursalHeaderCardProps {
  sucursal: Sucursal
  onEdit: () => void
  onToggleEstado: () => void
}

export function SucursalHeaderCard({ sucursal, onEdit, onToggleEstado }: SucursalHeaderCardProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{sucursal.nombre}</h2>
        {sucursal.direccion && <p className="text-sm text-muted-foreground">{sucursal.direccion}</p>}
        {(sucursal.responsable || sucursal.telefono) && (
          <p className="text-sm text-muted-foreground">
            {sucursal.responsable}
            {sucursal.responsable && sucursal.telefono && ' · '}
            {sucursal.telefono}
          </p>
        )}
        {!sucursal.activo && <p className="mt-1 text-sm font-medium text-destructive">Inactiva</p>}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onEdit}>
          Editar sucursal
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className={sucursal.activo ? 'text-destructive' : undefined}>
              {sucursal.activo ? 'Desactivar' : 'Activar'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {sucursal.activo ? `¿Desactivar ${sucursal.nombre}?` : `¿Activar ${sucursal.nombre}?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {sucursal.activo
                  ? 'Sus equipos y cajeros seguirán existiendo, pero ya no podrán abrir caja ahí.'
                  : 'Volverá a estar disponible para asignar cajeros y abrir caja.'}
              </AlertDialogDescription>
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
