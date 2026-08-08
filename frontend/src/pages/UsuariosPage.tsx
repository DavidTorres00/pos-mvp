import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { UsuarioEditForm } from '@/features/usuarios/components/UsuarioEditForm'
import { UsuarioForm } from '@/features/usuarios/components/UsuarioForm'
import { UsuarioPasswordForm } from '@/features/usuarios/components/UsuarioPasswordForm'
import { UsuariosTable } from '@/features/usuarios/components/UsuariosTable'
import {
  useActualizarUsuario,
  useCrearUsuario,
  useResetearPasswordUsuario,
  useSetPermisoDevoluciones,
  useSetPermisoRetiroExcedente,
} from '@/features/usuarios/hooks/useUsuarioMutations'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
import type {
  UsuarioCreateFormValues,
  UsuarioEditFormValues,
  UsuarioPasswordFormValues,
} from '@/features/usuarios/schemas/usuarioSchema'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
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
  const setPermisoDevoluciones = useSetPermisoDevoluciones()
  const setActivo = useActualizarUsuario()
  const dialog = useCrudDialogState<Usuario>()
  const passwordDialog = useCrudDialogState<Usuario>()
  const create = useCrearUsuario()
  const actualizar = useActualizarUsuario()
  const resetearPassword = useResetearPasswordUsuario()
  const { data: sucursalesData } = useSucursales('', 1, 100, isAdmin)
  // con 1 sola sucursal activa, la columna sería el mismo valor repetido en cada fila (ver
  // docs/FRONTEND.md) — mismo criterio que showSucursal en VentasTable/ProductosTable
  const mostrarColumnaSucursal = (sucursalesData?.items.filter((s) => s.activo).length ?? 0) > 1

  function handleCreate(values: UsuarioCreateFormValues) {
    create.mutate({ ...values, sucursal_id: values.sucursal_id as number }, { onSuccess: dialog.closeCreate })
  }

  function handleActualizar(values: UsuarioEditFormValues) {
    if (dialog.editing === null) return
    actualizar.mutate(
      { id: dialog.editing.id, nombre: values.nombre, email: values.email, sucursal_id: values.sucursal_id as number },
      { onSuccess: dialog.closeEdit },
    )
  }

  function handleResetearPassword(values: UsuarioPasswordFormValues) {
    if (passwordDialog.editing === null) return
    resetearPassword.mutate(
      { id: passwordDialog.editing.id, password: values.password },
      { onSuccess: passwordDialog.closeEdit },
    )
  }

  function handleToggleActivo(usuario: Usuario) {
    setActivo.mutate({ id: usuario.id, activo: !usuario.activo })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  function handleToggleExcedente(usuario: Usuario) {
    setPermiso.mutate({ id: usuario.id, puede_retirar_excedente: !usuario.puede_retirar_excedente })
  }

  function handleToggleDevoluciones(usuario: Usuario) {
    setPermisoDevoluciones.mutate({ id: usuario.id, puede_hacer_devoluciones: !usuario.puede_hacer_devoluciones })
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Cajeros del negocio, su sucursal y quién puede retirar excedente de caja o procesar devoluciones.
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
            <DialogTitle>Editar cajero</DialogTitle>
          </DialogHeader>
          {dialog.editing && (
            <UsuarioEditForm
              defaultValues={{
                nombre: dialog.editing.nombre,
                email: dialog.editing.email,
                sucursal_id: dialog.editing.sucursal_id,
              }}
              isPending={actualizar.isPending}
              errorMessage={
                actualizar.isError ? getApiErrorMessage(actualizar.error, 'No se pudo actualizar el cajero') : undefined
              }
              onSubmit={handleActualizar}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={passwordDialog.editing !== null} onOpenChange={(open) => !open && passwordDialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Restablecer contraseña{passwordDialog.editing ? ` · ${passwordDialog.editing.nombre}` : ''}
            </DialogTitle>
          </DialogHeader>
          <UsuarioPasswordForm
            isPending={resetearPassword.isPending}
            errorMessage={
              resetearPassword.isError
                ? getApiErrorMessage(resetearPassword.error, 'No se pudo restablecer la contraseña')
                : undefined
            }
            onSubmit={handleResetearPassword}
          />
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
          onToggleExcedente={handleToggleExcedente}
          onToggleDevoluciones={handleToggleDevoluciones}
          onToggleActivo={handleToggleActivo}
          onEdit={dialog.edit}
          onResetPassword={passwordDialog.edit}
          pendingExcedente={setPermiso.isPending}
          pendingDevoluciones={setPermisoDevoluciones.isPending}
          pendingActivo={setActivo.isPending}
          showSucursal={mostrarColumnaSucursal}
        />
      </TableCard>
    </div>
  )
}
