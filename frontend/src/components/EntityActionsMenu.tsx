import { EllipsisVerticalIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'

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
import { Button, type buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { VariantProps } from 'class-variance-authority'

interface EntityActionsMenuProps {
  // items de menú (`<DropdownMenuItem>`), no botones
  extraActions?: ReactNode
  editLabel?: string
  onEdit: () => void
  activo: boolean
  onToggleEstado: () => void
  toggleDialogTitle: string
  toggleDialogDescription: string
  triggerSize?: VariantProps<typeof buttonVariants>['size']
}

// Botón "⋮" + menú (Editar/Activar-Desactivar, más lo que mande `extraActions`) + confirmación
// de Activar/Desactivar — usado tanto en el header de detalle de un hub (EntityHeaderCard) como
// en cada fila de MasterListAside, para no repetir el mismo trío menú+confirm en los dos.
export function EntityActionsMenu({
  extraActions,
  editLabel = 'Editar',
  onEdit,
  activo,
  onToggleEstado,
  toggleDialogTitle,
  toggleDialogDescription,
  triggerSize = 'icon',
}: EntityActionsMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={triggerSize} aria-label="Más acciones">
            <EllipsisVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {extraActions}
          <DropdownMenuItem onSelect={onEdit}>{editLabel}</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
            className={activo ? 'text-destructive focus:text-destructive' : undefined}
          >
            {activo ? 'Desactivar' : 'Activar'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
    </>
  )
}
