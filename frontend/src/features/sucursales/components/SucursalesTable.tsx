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
import type { Sucursal } from '@/services/sucursalService'

interface SucursalesTableProps {
  sucursales: Sucursal[]
  emptyMessage?: string
  onEdit: (sucursal: Sucursal) => void
  onToggleEstado: (sucursal: Sucursal) => void
  onManageEquipos: (sucursal: Sucursal) => void
}

export function SucursalesTable({
  sucursales,
  emptyMessage = 'No hay sucursales.',
  onEdit,
  onToggleEstado,
  onManageEquipos,
}: SucursalesTableProps) {
  const [pending, setPending] = useState<Sucursal | null>(null)

  if (sucursales.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sucursales.map((sucursal) => (
            <TableRow key={sucursal.id}>
              <TableCell>{sucursal.nombre}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sucursal.activo}
                    onCheckedChange={() => setPending(sucursal)}
                    aria-label={sucursal.activo ? `Desactivar ${sucursal.nombre}` : `Activar ${sucursal.nombre}`}
                  />
                  <span className={sucursal.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                    {sucursal.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onManageEquipos(sucursal)}>
                    Equipos
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(sucursal)}>
                    Editar
                  </Button>
                </div>
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
                ? 'Sus equipos y cajeros seguirán existiendo, pero ya no podrán abrir caja ahí.'
                : 'Volverá a estar disponible para asignar cajeros y abrir caja.'}
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
