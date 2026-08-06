import { EntityHeaderCard } from '@/components/EntityHeaderCard'
import type { Sucursal } from '@/services/sucursalService'

interface SucursalHeaderCardProps {
  sucursal: Sucursal
  onEdit: () => void
  onToggleEstado: () => void
}

export function SucursalHeaderCard({ sucursal, onEdit, onToggleEstado }: SucursalHeaderCardProps) {
  return (
    <EntityHeaderCard
      nombre={sucursal.nombre}
      activo={sucursal.activo}
      editLabel="Editar sucursal"
      infoLines={
        <>
          {sucursal.direccion && <p className="text-sm text-muted-foreground">{sucursal.direccion}</p>}
          {(sucursal.responsable || sucursal.telefono) && (
            <p className="text-sm text-muted-foreground">
              {sucursal.responsable}
              {sucursal.responsable && sucursal.telefono && ' · '}
              {sucursal.telefono}
            </p>
          )}
        </>
      }
      onEdit={onEdit}
      onToggleEstado={onToggleEstado}
      toggleDialogTitle={sucursal.activo ? `¿Desactivar ${sucursal.nombre}?` : `¿Activar ${sucursal.nombre}?`}
      toggleDialogDescription={
        sucursal.activo
          ? 'Sus equipos y cajeros seguirán existiendo, pero ya no podrán abrir caja ahí.'
          : 'Volverá a estar disponible para asignar cajeros y abrir caja.'
      }
    />
  )
}
