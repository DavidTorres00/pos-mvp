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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import type { Usuario } from '@/services/usuarioService'

interface UsuariosTableProps {
  usuarios: Usuario[]
  onToggleExcedente: (usuario: Usuario) => void
  onToggleDevoluciones: (usuario: Usuario) => void
  onToggleActivo: (usuario: Usuario) => void
  onEdit: (usuario: Usuario) => void
  onResetPassword: (usuario: Usuario) => void
  pendingExcedente: boolean
  pendingDevoluciones: boolean
  pendingActivo: boolean
  showSucursal?: boolean
}

export function UsuariosTable({
  usuarios,
  onToggleExcedente,
  onToggleDevoluciones,
  onToggleActivo,
  onEdit,
  onResetPassword,
  pendingExcedente,
  pendingDevoluciones,
  pendingActivo,
  showSucursal = true,
}: UsuariosTableProps) {
  const [pending, setPending] = useState<Usuario | null>(null)

  if (usuarios.length === 0) {
    return <EmptyState message="No hay usuarios." bordered={false} />
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            {showSucursal && <TableHead>Sucursal</TableHead>}
            <TableHead>Estado</TableHead>
            <TableHead>Retirar excedente de caja</TableHead>
            <TableHead>Procesar devoluciones</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell>{usuario.nombre}</TableCell>
              <TableCell>{usuario.email}</TableCell>
              <TableCell>
                <Badge variant={usuario.role === 'admin' ? 'default' : 'secondary'}>
                  {usuario.role === 'admin' ? 'Admin' : 'Cajero'}
                </Badge>
              </TableCell>
              {showSucursal && <TableCell className="text-muted-foreground">{usuario.sucursal_nombre ?? '—'}</TableCell>}
              <TableCell>
                {usuario.role === 'admin' ? (
                  <span className="text-sm text-muted-foreground">Activo</span>
                ) : (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={usuario.activo}
                      disabled={pendingActivo}
                      onCheckedChange={() => setPending(usuario)}
                      aria-label={usuario.activo ? `Desactivar ${usuario.nombre}` : `Activar ${usuario.nombre}`}
                    />
                    <span className={usuario.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                      {usuario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {usuario.role === 'admin' ? (
                  <span className="text-sm text-muted-foreground">Siempre puede</span>
                ) : (
                  <Switch
                    checked={usuario.puede_retirar_excedente}
                    disabled={pendingExcedente}
                    onCheckedChange={() => onToggleExcedente(usuario)}
                    aria-label={
                      usuario.puede_retirar_excedente
                        ? `Quitar permiso de retiro a ${usuario.nombre}`
                        : `Dar permiso de retiro a ${usuario.nombre}`
                    }
                  />
                )}
              </TableCell>
              <TableCell>
                {usuario.role === 'admin' ? (
                  <span className="text-sm text-muted-foreground">Siempre puede</span>
                ) : (
                  <Switch
                    checked={usuario.puede_hacer_devoluciones}
                    disabled={pendingDevoluciones}
                    onCheckedChange={() => onToggleDevoluciones(usuario)}
                    aria-label={
                      usuario.puede_hacer_devoluciones
                        ? `Quitar permiso de devoluciones a ${usuario.nombre}`
                        : `Dar permiso de devoluciones a ${usuario.nombre}`
                    }
                  />
                )}
              </TableCell>
              <TableCell>
                {usuario.role !== 'admin' && (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(usuario)}>
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onResetPassword(usuario)}>
                      Restablecer contraseña
                    </Button>
                  </div>
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
              {pending?.activo ? `¿Desactivar a ${pending?.nombre}?` : `¿Activar a ${pending?.nombre}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.activo
                ? 'Ya no podrá iniciar sesión. Si tiene una caja abierta, cerrala primero — el sistema lo va a rechazar si no.'
                : 'Vuelve a poder iniciar sesión y usar el sistema con normalidad.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) onToggleActivo(pending)
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
