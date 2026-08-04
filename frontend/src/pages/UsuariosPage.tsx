import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'
import { UsuariosTable } from '@/features/usuarios/components/UsuariosTable'
import { useSetPermisoRetiroExcedente } from '@/features/usuarios/hooks/useUsuarioMutations'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
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

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tenés acceso a este módulo.</p>
      </div>
    )
  }

  function handleToggle(usuario: Usuario) {
    setPermiso.mutate({ id: usuario.id, puede_retirar_excedente: !usuario.puede_retirar_excedente })
  }

  return (
    <div className="flex max-w-4xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
      <p className="text-sm text-muted-foreground">
        Controlá qué cajeros pueden ejecutar el retiro de excedente de caja.
      </p>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : (
        <>
          <UsuariosTable usuarios={usuarios} onTogglePermiso={handleToggle} pending={setPermiso.isPending} />
          <Pagination page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
