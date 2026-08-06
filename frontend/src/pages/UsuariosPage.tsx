import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TableCard } from '@/components/TableCard'
import { CierreCajaForm } from '@/features/caja/components/CierreCajaForm'
import { VoucherRetiroDialog } from '@/features/caja/components/VoucherRetiroDialog'
import { useCajaResumen } from '@/features/caja/hooks/useCajaResumen'
import type { CierreFormValues } from '@/features/caja/schemas/cajaSchema'
import { UsuarioForm } from '@/features/usuarios/components/UsuarioForm'
import { UsuariosTable } from '@/features/usuarios/components/UsuariosTable'
import { useCajaDeUsuario } from '@/features/usuarios/hooks/useCajaDeUsuario'
import {
  useCerrarCajaDeUsuario,
  useCrearUsuario,
  useRetirarExcedenteDeUsuario,
  useSetPermisoRetiroExcedente,
} from '@/features/usuarios/hooks/useUsuarioMutations'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
import type { UsuarioCreateFormValues } from '@/features/usuarios/schemas/usuarioSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { formatCurrency } from '@/lib/format'
import { usePagination } from '@/lib/hooks/usePagination'
import type { VoucherRetiro } from '@/services/cajaService'
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

  // corte de caja de emergencia: si el cajero con la caja activa no puede hacerlo él mismo,
  // el admin lo hace desde aquí, contra la caja de ESE cajero (no la propia del admin, que
  // nunca existe) — vía /usuarios/{id}/caja, scopeado al id del path, no al que llama
  const [cerrandoCajaDe, setCerrandoCajaDe] = useState<Usuario | null>(null)
  const { data: cajaActual } = useCajaDeUsuario(cerrandoCajaDe?.id)
  const { data: resumen } = useCajaResumen(cerrandoCajaDe ? cajaActual?.caja?.id : undefined)
  const cerrar = useCerrarCajaDeUsuario()

  // cuadre de caja rutinario, no una excepción: el admin puede retirar el excedente de
  // cualquier cajero cuando corresponda, sin depender de que ese cajero tenga el permiso o
  // esté disponible en ese momento
  const [retirandoExcedenteDe, setRetirandoExcedenteDe] = useState<Usuario | null>(null)
  const { data: cajaExcedente } = useCajaDeUsuario(retirandoExcedenteDe?.id)
  const retirarExcedente = useRetirarExcedenteDeUsuario()
  const [voucher, setVoucher] = useState<VoucherRetiro | null>(null)

  function handleCreate(values: UsuarioCreateFormValues) {
    create.mutate({ ...values, sucursal_id: values.sucursal_id as number }, { onSuccess: dialog.closeCreate })
  }

  function handleCerrarCaja(values: CierreFormValues) {
    if (cerrar.isPending || !cerrandoCajaDe) return
    cerrar.mutate({ id: cerrandoCajaDe.id, ...values }, { onSuccess: () => setCerrandoCajaDe(null) })
  }

  function handleRetirarExcedente() {
    if (retirarExcedente.isPending || !retirandoExcedenteDe) return
    retirarExcedente.mutate(retirandoExcedenteDe.id, {
      onSuccess: (data) => {
        setRetirandoExcedenteDe(null)
        setVoucher(data)
      },
    })
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
          Controla qué cajeros pueden ejecutar el retiro de excedente de caja.
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
        <UsuariosTable
          usuarios={usuarios}
          onTogglePermiso={handleToggle}
          onCerrarCaja={setCerrandoCajaDe}
          onRetirarExcedente={setRetirandoExcedenteDe}
          pending={setPermiso.isPending}
        />
      </TableCard>

      <Dialog open={cerrandoCajaDe !== null} onOpenChange={(open) => !open && setCerrandoCajaDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar caja de {cerrandoCajaDe?.nombre}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Corte de emergencia: úsalo solo si {cerrandoCajaDe?.nombre} no puede cerrar su propia caja.
          </p>
          <CierreCajaForm
            resumen={resumen}
            isPending={cerrar.isPending}
            errorMessage={cerrar.isError ? getApiErrorMessage(cerrar.error, 'No se pudo cerrar la caja') : undefined}
            onSubmit={handleCerrarCaja}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={retirandoExcedenteDe !== null} onOpenChange={(open) => !open && setRetirandoExcedenteDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirar excedente de {retirandoExcedenteDe?.nombre}</DialogTitle>
          </DialogHeader>
          {cajaExcedente && (
            <div className="flex flex-col gap-1.5 rounded-md border p-3 text-sm tabular-nums">
              <p className="flex justify-between">
                <span className="text-muted-foreground">Efectivo en caja</span>
                {formatCurrency(cajaExcedente.efectivo_actual ?? '0')}
              </p>
              <p className="flex justify-between">
                <span className="text-muted-foreground">Límite configurado</span>
                {formatCurrency(cajaExcedente.limite_efectivo ?? '0')}
              </p>
            </div>
          )}
          {retirarExcedente.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(retirarExcedente.error, 'No se pudo retirar el excedente')}
            </p>
          )}
          <Button onClick={handleRetirarExcedente} disabled={retirarExcedente.isPending}>
            {retirarExcedente.isPending ? 'Retirando...' : 'Confirmar retiro'}
          </Button>
        </DialogContent>
      </Dialog>

      <VoucherRetiroDialog voucher={voucher} onClose={() => setVoucher(null)} />
    </div>
  )
}
