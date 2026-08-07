import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { UsuarioForm } from '@/features/usuarios/components/UsuarioForm'
import { UsuarioNombreForm } from '@/features/usuarios/components/UsuarioNombreForm'
import { UsuariosTable } from '@/features/usuarios/components/UsuariosTable'
import {
  useActualizarNombreUsuario,
  useCrearUsuario,
  useSetPermisoRetiroExcedente,
} from '@/features/usuarios/hooks/useUsuarioMutations'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
import type { UsuarioCreateFormValues, UsuarioNombreFormValues } from '@/features/usuarios/schemas/usuarioSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Usuario } from '@/services/usuarioService'
import { useAuthStore } from '@/stores/authStore'

export function UsuariosPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const { page, size, setPage } = usePagination(20)
  const { data, isLoading, isError } = useUsuarios(page, size, isAdmin)
  const usuarios = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const setPermiso = useSetPermisoRetiroExcedente()
  const dialog = useCrudDialogState<Usuario>()
  const create = useCrearUsuario()
  const actualizarNombre = useActualizarNombreUsuario()

  function handleCreate(values: UsuarioCreateFormValues) {
    create.mutate({ ...values, sucursal_id: values.sucursal_id as number }, { onSuccess: dialog.closeCreate })
  }

  function handleActualizarNombre(values: UsuarioNombreFormValues) {
    if (dialog.editing === null) return
    actualizarNombre.mutate({ id: dialog.editing.id, nombre: values.nombre }, { onSuccess: dialog.closeEdit })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  function handleToggle(usuario: Usuario) {
    setPermiso.mutate({ id: usuario.id, puede_retirar_excedente: !usuario.puede_retirar_excedente })
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Cajeros del negocio, su sucursal y quién puede retirar excedente de caja.
        </p>
        <Dialog open={dialog.createOpen} onOpenChange={dialog.setCreateOpen}>
          <DialogTrigger asChild>
            <Button>Nuevo cajero</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo cajero</DialogTitle>
            </DialogHeader>
            <UsuarioForm
              isPending={create.isPending}
              errorMessage={create.isError ? getApiErrorMessage(create.error, 'No se pudo crear el usuario') : undefined}
              onSubmit={handleCreate}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={dialog.editing !== null} onOpenChange={(open) => !open && dialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar nombre</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <UsuarioNombreForm
              defaultValues={{ nombre: dialog.editing.nombre }}
              isPending={actualizarNombre.isPending}
              errorMessage={
                actualizarNombre.isError
                  ? getApiErrorMessage(actualizarNombre.error, 'No se pudo actualizar el nombre')
                  : undefined
              }
              onSubmit={handleActualizarNombre}
            />
          )}
        </DialogContent>
      </Dialog>

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <UsuariosTable
          usuarios={usuarios}
          onTogglePermiso={handleToggle}
          onEdit={dialog.edit}
          pending={setPermiso.isPending}
        />
      </TableCard>
    </div>
  )
}
