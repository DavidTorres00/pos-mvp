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
import type { Subcategoria } from '@/services/subcategoriaService'

interface SubcategoriasTableProps {
  subcategorias: Subcategoria[]
  canManage: boolean
  emptyMessage?: string
  onEdit: (subcategoria: Subcategoria) => void
  onToggleEstado: (subcategoria: Subcategoria) => void
}

export function SubcategoriasTable({
  subcategorias,
  canManage,
  emptyMessage = 'No hay subcategorías.',
  onEdit,
  onToggleEstado,
}: SubcategoriasTableProps) {
  const [pending, setPending] = useState<Subcategoria | null>(null)

  if (subcategorias.length === 0) {
    return <EmptyState message={emptyMessage} bordered={false} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {subcategorias.map((subcategoria) => (
            <TableRow key={subcategoria.id}>
              <TableCell className="tabular-nums text-muted-foreground">
                {subcategoria.categoria.codigo}
                {subcategoria.codigo}
              </TableCell>
              <TableCell>{subcategoria.nombre}</TableCell>
              <TableCell>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={subcategoria.activo}
                      onCheckedChange={() => setPending(subcategoria)}
                      aria-label={
                        subcategoria.activo ? `Desactivar ${subcategoria.nombre}` : `Activar ${subcategoria.nombre}`
                      }
                    />
                    <span
                      className={subcategoria.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}
                    >
                      {subcategoria.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ) : (
                  <span className={subcategoria.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                    {subcategoria.activo ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => onEdit(subcategoria)}>
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
                ? 'Los productos de esta subcategoría la seguirán mostrando hasta que la reasignes.'
                : 'La subcategoría volverá a estar disponible para asignar a productos.'}
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
