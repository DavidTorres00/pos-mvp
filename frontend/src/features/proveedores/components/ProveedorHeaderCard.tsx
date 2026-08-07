import { EntityActionsMenu } from '@/components/EntityActionsMenu'
import { EntityHeaderCard } from '@/components/EntityHeaderCard'
import type { ProveedorResumen } from '@/services/proveedorService'

interface ProveedorHeaderCardProps {
  proveedor: ProveedorResumen
  onEdit: () => void
  onToggleEstado: () => void
}

export function ProveedorHeaderCard({ proveedor, onEdit, onToggleEstado }: ProveedorHeaderCardProps) {
  return (
    <EntityHeaderCard
      nombre={proveedor.nombre}
      activo={proveedor.activo}
      infoLines={
        <>
          {(proveedor.contacto || proveedor.telefono) && (
            <p className="text-sm text-muted-foreground">
              {proveedor.contacto}
              {proveedor.contacto && proveedor.telefono && ' · '}
              {proveedor.telefono}
            </p>
          )}
          {proveedor.email && <p className="text-sm text-muted-foreground">{proveedor.email}</p>}
          <p className="text-sm text-muted-foreground">
            {proveedor.clabe ? `CLABE ${proveedor.clabe}` : 'Sin CLABE — no se le puede pagar un pedido todavía'}
          </p>
        </>
      }
      actions={
        <EntityActionsMenu
          editLabel="Editar proveedor"
          onEdit={onEdit}
          activo={proveedor.activo}
          onToggleEstado={onToggleEstado}
          toggleDialogTitle={proveedor.activo ? `¿Desactivar ${proveedor.nombre}?` : `¿Activar ${proveedor.nombre}?`}
          toggleDialogDescription={
            proveedor.activo
              ? 'Ya no aparecerá para asignarlo a productos nuevos ni para armar pedidos.'
              : 'Volverá a estar disponible para asignar a productos y armar pedidos.'
          }
        />
      }
    />
  )
}
