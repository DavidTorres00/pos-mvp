import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { UsuarioForm } from '@/features/usuarios/components/UsuarioForm'
import { UsuariosTable } from '@/features/usuarios/components/UsuariosTable'
import { useCrearUsuario, useSetPermisoRetiroExcedente } from '@/features/usuarios/hooks/useUsuarioMutations'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
import type { UsuarioCreateFormValues } from '@/features/usuarios/schemas/usuarioSchema'
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

  function handleCreate(values: UsuarioCreateFormValues) {
    create.mutate({ ...values, sucursal_id: values.sucursal_id as number }, { onSuccess: dialog.closeCreate })
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

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <UsuariosTable usuarios={usuarios} onTogglePermiso={handleToggle} pending={setPermiso.isPending} />
      </TableCard>
    </div>
  )
}
