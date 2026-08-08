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
  onEdit: (usuario: Usuario) => void
  pendingExcedente: boolean
  pendingDevoluciones: boolean
  showSucursal?: boolean
}

export function UsuariosTable({
  usuarios,
  onToggleExcedente,
  onToggleDevoluciones,
  onEdit,
  pendingExcedente,
  pendingDevoluciones,
  showSucursal = true,
}: UsuariosTableProps) {
  if (usuarios.length === 0) {
    return <EmptyState message="No hay usuarios." bordered={false} />
  }

  return (
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
            <TableCell className={usuario.activo ? 'text-foreground' : 'text-muted-foreground'}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
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
              <Button variant="outline" size="sm" onClick={() => onEdit(usuario)}>
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
