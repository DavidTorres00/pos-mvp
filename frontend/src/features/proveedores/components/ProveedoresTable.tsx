import { useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import type { Proveedor } from '@/services/proveedorService'

interface ProveedoresTableProps {
  proveedores: Proveedor[]
  emptyMessage?: string
  onEdit: (proveedor: Proveedor) => void
  onToggleEstado: (proveedor: Proveedor) => void
}

export function ProveedoresTable({
  proveedores,
  emptyMessage = 'No hay proveedores.',
  onEdit,
  onToggleEstado,
}: ProveedoresTableProps) {
  const [pending, setPending] = useState<Proveedor | null>(null)

  if (proveedores.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {proveedores.map((proveedor) => (
            <TableRow key={proveedor.id}>
              <TableCell>{proveedor.nombre}</TableCell>
              <TableCell>{proveedor.contacto ?? '—'}</TableCell>
              <TableCell>{proveedor.telefono ?? '—'}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={proveedor.activo}
                    onCheckedChange={() => setPending(proveedor)}
                    aria-label={proveedor.activo ? `Desactivar ${proveedor.nombre}` : `Activar ${proveedor.nombre}`}
                  />
                  <span className={proveedor.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                    {proveedor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onEdit(proveedor)}>
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.activo ? `¿Desactivar ${pending?.nombre}?` : `¿Activar ${pending?.nombre}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.activo
                ? 'Ya no vas a poder seleccionarlo en compras nuevas.'
                : 'Volverá a estar disponible para seleccionar en compras.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) onToggleEstado(pending)
                setPending(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
