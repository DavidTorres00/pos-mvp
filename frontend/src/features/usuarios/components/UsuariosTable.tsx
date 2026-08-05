import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import type { Usuario } from '@/services/usuarioService'

interface UsuariosTableProps {
  usuarios: Usuario[]
  onTogglePermiso: (usuario: Usuario) => void
  onCerrarCaja: (usuario: Usuario) => void
  onRetirarExcedente: (usuario: Usuario) => void
  pending: boolean
}

export function UsuariosTable({ usuarios, onTogglePermiso, onCerrarCaja, onRetirarExcedente, pending }: UsuariosTableProps) {
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
          <TableHead>Sucursal</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Caja</TableHead>
          <TableHead>Puede retirar excedente de caja</TableHead>
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
            <TableCell className="text-muted-foreground">{usuario.sucursal_nombre ?? '—'}</TableCell>
            <TableCell className={usuario.activo ? 'text-foreground' : 'text-muted-foreground'}>
              {usuario.activo ? 'Activo' : 'Inactivo'}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm">
                  <span
                    className={`size-2 rounded-full ${usuario.caja_activa ? 'bg-success' : 'bg-muted-foreground/40'}`}
                    aria-hidden="true"
                  />
                  {usuario.caja_activa ? 'Caja activa' : 'Sin caja'}
                </span>
                {usuario.caja_activa && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onRetirarExcedente(usuario)}>
                      Retirar excedente
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onCerrarCaja(usuario)}>
                      Cerrar caja
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
            <TableCell>
              {usuario.role === 'admin' ? (
                <span className="text-sm text-muted-foreground">Siempre puede</span>
              ) : (
                <Switch
                  checked={usuario.puede_retirar_excedente}
                  disabled={pending}
                  onCheckedChange={() => onTogglePermiso(usuario)}
                  aria-label={
                    usuario.puede_retirar_excedente
                      ? `Quitar permiso de retiro a ${usuario.nombre}`
                      : `Dar permiso de retiro a ${usuario.nombre}`
                  }
                />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
