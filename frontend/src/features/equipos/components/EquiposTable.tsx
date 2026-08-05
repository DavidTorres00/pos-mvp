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
import type { Equipo } from '@/services/equipoService'

interface EquiposTableProps {
  equipos: Equipo[]
  canManage: boolean
  emptyMessage?: string
  onEdit: (equipo: Equipo) => void
  onToggleEstado: (equipo: Equipo) => void
}

export function EquiposTable({
  equipos,
  canManage,
  emptyMessage = 'No hay equipos.',
  onEdit,
  onToggleEstado,
}: EquiposTableProps) {
  const [pending, setPending] = useState<Equipo | null>(null)

  if (equipos.length === 0) {
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
          {equipos.map((equipo) => (
            <TableRow key={equipo.id}>
              <TableCell>{equipo.nombre}</TableCell>
              <TableCell>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={equipo.activo}
                      onCheckedChange={() => setPending(equipo)}
                      aria-label={equipo.activo ? `Desactivar ${equipo.nombre}` : `Activar ${equipo.nombre}`}
                    />
                    <span className={equipo.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                      {equipo.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ) : (
                  <span className={equipo.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                    {equipo.activo ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(equipo)}>
                    Editar
                  </Button>
                )}
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
                ? 'Ningún cajero podrá abrir caja en este equipo hasta que lo reactives.'
                : 'Volverá a estar disponible para abrir caja.'}
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
