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
import type { Categoria } from '@/services/categoriaService'

interface CategoriasTableProps {
  categorias: Categoria[]
  canManage: boolean
  emptyMessage?: string
  onEdit: (categoria: Categoria) => void
  onToggleEstado: (categoria: Categoria) => void
  onManageSubcategorias: (categoria: Categoria) => void
}

export function CategoriasTable({
  categorias,
  canManage,
  emptyMessage = 'No hay categorías.',
  onEdit,
  onToggleEstado,
  onManageSubcategorias,
}: CategoriasTableProps) {
  const [pending, setPending] = useState<Categoria | null>(null)

  if (categorias.length === 0) {
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
          {categorias.map((categoria) => (
            <TableRow key={categoria.id}>
              <TableCell>{categoria.nombre}</TableCell>
              <TableCell>
                {canManage ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={categoria.activo}
                      onCheckedChange={() => setPending(categoria)}
                      aria-label={categoria.activo ? `Desactivar ${categoria.nombre}` : `Activar ${categoria.nombre}`}
                    />
                    <span className={categoria.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                      {categoria.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ) : (
                  <span className={categoria.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                    {categoria.activo ? 'Activo' : 'Inactivo'}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onManageSubcategorias(categoria)}>
                    Subcategorías
                  </Button>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={() => onEdit(categoria)}>
                      Editar
                    </Button>
                  )}
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
                ? 'Los productos de esta categoría la seguirán mostrando hasta que la reasignes.'
                : 'La categoría volverá a estar disponible para asignar a productos.'}
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
