import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, LoadingState } from '@/components/DataStates'
import { TableCard } from '@/components/TableCard'
import { CierreCajaForm } from '@/features/caja/components/CierreCajaForm'
import { useCajaResumen } from '@/features/caja/hooks/useCajaResumen'
import type { CierreFormValues } from '@/features/caja/schemas/cajaSchema'
import { EquipoForm } from '@/features/equipos/components/EquipoForm'
import { useCrearEquipo, useSetEstadoEquipo, useUpdateEquipo } from '@/features/equipos/hooks/useEquipoMutations'
import type { EquipoFormValues } from '@/features/equipos/schemas/equipoSchema'
import { CajasDeSucursalTable } from '@/features/sucursales/components/CajasDeSucursalTable'
import { SucursalForm } from '@/features/sucursales/components/SucursalForm'
import { SucursalHeaderCard } from '@/features/sucursales/components/SucursalHeaderCard'
import { SucursalStatsRow } from '@/features/sucursales/components/SucursalStatsRow'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import {
  useCrearSucursal,
  useSetEstadoSucursal,
  useUpdateSucursal,
} from '@/features/sucursales/hooks/useSucursalMutations'
import type { SucursalFormValues } from '@/features/sucursales/schemas/sucursalSchema'
import { useCajaDeUsuario } from '@/features/usuarios/hooks/useCajaDeUsuario'
import {
  useCerrarCajaDeUsuario,
  useRetirarExcedenteDeUsuario,
} from '@/features/usuarios/hooks/useUsuarioMutations'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { formatCurrency, formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getResumenSucursales } from '@/services/reporteService'
import { getCajasDeSucursal, type Sucursal, type SucursalPayload } from '@/services/sucursalService'
import { useAuthStore } from '@/stores/authStore'

interface EquipoObjetivo {
  id: number
  nombre: string
}

function toSucursalPayload(values: SucursalFormValues): SucursalPayload {
  return {
    nombre: values.nombre,
    direccion: values.direccion || undefined,
    responsable: values.responsable || undefined,
    telefono: values.telefono || undefined,
    limite_efectivo_caja: values.limite_efectivo_caja ? Number(values.limite_efectivo_caja) : undefined,
  }
}

export function SucursalesPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  // llegada desde una alerta del Dashboard ("Ver cajero"/"Cerrar caja"): abre directo en la
  // sucursal y resalta la caja exacta en vez de dejar al admin buscarla a mano. Se captura una
  // sola vez a estado propio (no se lee directo de la URL en cada render) porque el resaltado
  // se limpia solo — al resolver la acción sobre esa caja, o de entrada si se recarga la
  // página — y la URL se despeja al llegar para que no quede "marcada" para siempre.
  const [searchParams, setSearchParams] = useSearchParams()
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(() => {
    const p = searchParams.get('sucursalId')
    return p ? Number(p) : null
  })
  const [equipoIdResaltado, setEquipoIdResaltado] = useState<number | null>(() => {
    const p = searchParams.get('equipoId')
    return p ? Number(p) : null
  })

  useEffect(() => {
    if (searchParams.has('sucursalId') || searchParams.has('equipoId')) {
      setSearchParams({}, { replace: true })
    }
    // solo al montar: captura el estado inicial de la URL una vez, después la URL queda limpia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { data: sucursalesData, isLoading, isError } = useSucursales(debouncedSearch, 1, 100)
  const sucursales = sucursalesData?.items ?? []
  const seleccionada = sucursales.find((s) => s.id === seleccionadaId) ?? null
  const primeraSucursalId = sucursales[0]?.id

  useEffect(() => {
    if (seleccionadaId === null && primeraSucursalId !== undefined) setSeleccionadaId(primeraSucursalId)
  }, [seleccionadaId, primeraSucursalId])

  const { data: resumenes } = useQuery({ queryKey: ['resumen-sucursales'], queryFn: getResumenSucursales })
  const resumenSeleccionada = resumenes?.find((r) => r.sucursal_id === seleccionadaId)

  const {
    data: cajasEstado,
    isLoading: isLoadingCajas,
    isError: isErrorCajas,
  } = useQuery({
    queryKey: ['sucursal-cajas', seleccionadaId],
    queryFn: () => getCajasDeSucursal(seleccionadaId as number),
    enabled: seleccionadaId !== null,
  })

  const sucursalDialog = useCrudDialogState<Sucursal>()
  const crearSucursal = useCrearSucursal()
  const updateSucursal = useUpdateSucursal()
  const setEstadoSucursal = useSetEstadoSucursal()

  const equipoDialog = useCrudDialogState<EquipoObjetivo>()
  const crearEquipo = useCrearEquipo()
  const updateEquipo = useUpdateEquipo()
  const setEstadoEquipo = useSetEstadoEquipo()

  // corte de caja de emergencia / retiro de excedente: se disparan desde la fila de la caja,
  // no de un listado de usuarios — el admin identifica el problema por equipo/sucursal
  const [cerrandoCajaDe, setCerrandoCajaDe] = useState<EquipoObjetivo | null>(null)
  const { data: cajaDeCerrando } = useCajaDeUsuario(cerrandoCajaDe?.id)
  const { data: resumenCierre } = useCajaResumen(cerrandoCajaDe ? cajaDeCerrando?.caja?.id : undefined)
  const cerrarCaja = useCerrarCajaDeUsuario()

  const [retirandoExcedenteDe, setRetirandoExcedenteDe] = useState<EquipoObjetivo | null>(null)
  const { data: cajaExcedente } = useCajaDeUsuario(retirandoExcedenteDe?.id)
  const retirarExcedente = useRetirarExcedenteDeUsuario()

  const hayFiltrosActivos = search !== ''

  function handleCrearSucursal(values: SucursalFormValues) {
    crearSucursal.mutate(toSucursalPayload(values), { onSuccess: sucursalDialog.closeCreate })
  }

  function handleUpdateSucursal(values: SucursalFormValues) {
    if (!sucursalDialog.editing) return
    updateSucursal.mutate(
      { id: sucursalDialog.editing.id, payload: toSucursalPayload(values) },
      { onSuccess: sucursalDialog.closeEdit },
    )
  }

  function handleCrearEquipo(values: EquipoFormValues) {
    if (seleccionadaId === null) return
    crearEquipo.mutate({ ...values, sucursal_id: seleccionadaId }, { onSuccess: equipoDialog.closeCreate })
  }

  function handleUpdateEquipo(values: EquipoFormValues) {
    if (!equipoDialog.editing) return
    updateEquipo.mutate({ id: equipoDialog.editing.id, nombre: values.nombre }, { onSuccess: equipoDialog.closeEdit })
  }

  function handleCerrarCaja(values: CierreFormValues) {
    if (cerrarCaja.isPending || !cerrandoCajaDe) return
    cerrarCaja.mutate(
      { id: cerrandoCajaDe.id, ...values },
      {
        onSuccess: () => {
          setCerrandoCajaDe(null)
          setEquipoIdResaltado(null)
        },
      },
    )
  }

  // sin comprobante/imprimir aquí a propósito: quien realmente imprime el voucher es el cajero
  // en su propia caja (ver docs/FRONTEND.md — imprimir desde el navegador del admin no sirve de
  // nada si retira remoto). Al admin le interesa liberar la caja, y eso ya se ve reflejado al
  // instante en la tabla (estado deja de mostrar "Excedida").
  function handleRetirarExcedente() {
    if (retirarExcedente.isPending || !retirandoExcedenteDe) return
    retirarExcedente.mutate(retirandoExcedenteDe.id, {
      onSuccess: () => {
        setRetirandoExcedenteDe(null)
        setEquipoIdResaltado(null)
      },
    })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Sucursales</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  const cajasConfiguradas = cajasEstado?.length ?? 0
  const cajasAbiertasAhora = cajasEstado?.filter((c) => c.estado !== 'cerrada').length ?? 0
  const efectivoEnCajas = (cajasEstado ?? []).reduce((sum, c) => sum + Number(c.monto_esperado ?? 0), 0)
  const ventasHoy = Number(resumenSeleccionada?.ventas_hoy ?? 0)

  return (
    <div className="flex w-full flex-col gap-4 p-6 lg:flex-row lg:items-start">
      <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold tracking-tight">Sucursales</h1>
          <Dialog open={sucursalDialog.createOpen} onOpenChange={sucursalDialog.setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Nueva sucursal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva sucursal</DialogTitle>
              </DialogHeader>
              <SucursalForm
                isPending={crearSucursal.isPending}
                errorMessage={
                  crearSucursal.isError ? getApiErrorMessage(crearSucursal.error, 'No se pudo crear la sucursal') : undefined
                }
                onSubmit={handleCrearSucursal}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar sucursales"
          />
          {hayFiltrosActivos && (
            <Button variant="ghost" size="sm" onClick={() => setSearch('')}>
              Limpiar
            </Button>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState />
        ) : sucursales.length === 0 ? (
          <EmptyState message="No hay sucursales." bordered={false} />
        ) : (
          <nav className="flex flex-col gap-1.5">
            {sucursales.map((s) => {
              const resumen = resumenes?.find((r) => r.sucursal_id === s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeleccionadaId(s.id)}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-lg border p-3 text-left text-sm transition-colors',
                    s.id === seleccionadaId ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                  )}
                >
                  <span className={cn('font-medium', !s.activo && 'text-muted-foreground')}>{s.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {resumen
                      ? `${resumen.equipos_activos} ${resumen.equipos_activos === 1 ? 'caja' : 'cajas'} · ${resumen.cajas_abiertas} ${resumen.cajas_abiertas === 1 ? 'abierta' : 'abiertas'}`
                      : '—'}
                  </span>
                </button>
              )
            })}
          </nav>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {!seleccionada ? (
          <EmptyState message="Selecciona una sucursal para ver su detalle." />
        ) : (
          <>
            <SucursalHeaderCard
              sucursal={seleccionada}
              onEdit={() => sucursalDialog.edit(seleccionada)}
              onToggleEstado={() => setEstadoSucursal.mutate({ id: seleccionada.id, activo: !seleccionada.activo })}
            />

            <SucursalStatsRow
              cajasConfiguradas={cajasConfiguradas}
              cajasAbiertas={cajasAbiertasAhora}
              efectivoEnCajas={efectivoEnCajas}
              ventasHoy={ventasHoy}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">Cajas de esta sucursal</h2>
                <Dialog open={equipoDialog.createOpen} onOpenChange={equipoDialog.setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Agregar caja</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nueva caja en {seleccionada.nombre}</DialogTitle>
                    </DialogHeader>
                    <EquipoForm
                      isPending={crearEquipo.isPending}
                      errorMessage={
                        crearEquipo.isError ? getApiErrorMessage(crearEquipo.error, 'No se pudo crear la caja') : undefined
                      }
                      onSubmit={handleCrearEquipo}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <TableCard
                isLoading={isLoadingCajas}
                isError={isErrorCajas}
                page={1}
                pageCount={1}
                total={cajasConfiguradas}
                onPageChange={() => {}}
              >
                <CajasDeSucursalTable
                  cajas={cajasEstado ?? []}
                  equipoIdResaltado={equipoIdResaltado}
                  onEditarEquipo={equipoDialog.edit}
                  onToggleEstadoEquipo={(equipo) => setEstadoEquipo.mutate({ id: equipo.id, activo: equipo.activo })}
                  onRetirarExcedente={setRetirandoExcedenteDe}
                  onCerrarCaja={setCerrandoCajaDe}
                />
              </TableCard>
            </div>
          </>
        )}
      </div>

      <Dialog open={sucursalDialog.editing !== null} onOpenChange={(open) => !open && sucursalDialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sucursal</DialogTitle>
          </DialogHeader>
          {sucursalDialog.editing && (
            <SucursalForm
              defaultValues={{
                nombre: sucursalDialog.editing.nombre,
                direccion: sucursalDialog.editing.direccion ?? undefined,
                responsable: sucursalDialog.editing.responsable ?? undefined,
                telefono: sucursalDialog.editing.telefono ?? undefined,
                limite_efectivo_caja: sucursalDialog.editing.limite_efectivo_caja ?? undefined,
              }}
              isPending={updateSucursal.isPending}
              errorMessage={
                updateSucursal.isError ? getApiErrorMessage(updateSucursal.error, 'No se pudo actualizar la sucursal') : undefined
              }
              onSubmit={handleUpdateSucursal}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={equipoDialog.editing !== null} onOpenChange={(open) => !open && equipoDialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar caja</DialogTitle>
          </DialogHeader>
          {equipoDialog.editing && (
            <EquipoForm
              defaultValues={{ nombre: equipoDialog.editing.nombre }}
              isPending={updateEquipo.isPending}
              errorMessage={
                updateEquipo.isError ? getApiErrorMessage(updateEquipo.error, 'No se pudo actualizar la caja') : undefined
              }
              onSubmit={handleUpdateEquipo}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={cerrandoCajaDe !== null} onOpenChange={(open) => !open && setCerrandoCajaDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar caja de {cerrandoCajaDe?.nombre}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Corte de emergencia: úsalo solo si {cerrandoCajaDe?.nombre} no puede cerrar su propia caja.
          </p>
          <CierreCajaForm
            resumen={resumenCierre}
            isPending={cerrarCaja.isPending}
            errorMessage={cerrarCaja.isError ? getApiErrorMessage(cerrarCaja.error, 'No se pudo cerrar la caja') : undefined}
            onSubmit={handleCerrarCaja}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={retirandoExcedenteDe !== null} onOpenChange={(open) => !open && setRetirandoExcedenteDe(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirar excedente de {retirandoExcedenteDe?.nombre}</DialogTitle>
          </DialogHeader>
          {cajaExcedente?.caja && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border p-3 text-sm">
                <span className="text-muted-foreground">Sucursal</span>
                <span className="text-right font-medium">{cajaExcedente.caja.sucursal_nombre}</span>
                <span className="text-muted-foreground">Equipo</span>
                <span className="text-right font-medium">{cajaExcedente.caja.equipo_nombre}</span>
                <span className="text-muted-foreground">Caja abierta desde</span>
                <span className="text-right font-medium">{formatTime(cajaExcedente.caja.fecha_apertura)}</span>
                <span className="text-muted-foreground">Efectivo en caja</span>
                <span className="text-right font-medium tabular-nums">
                  {formatCurrency(cajaExcedente.efectivo_actual ?? '0')}
                </span>
                <span className="text-muted-foreground">Límite configurado</span>
                <span className="text-right font-medium tabular-nums">
                  {formatCurrency(cajaExcedente.limite_efectivo ?? '0')}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-md bg-primary/5 p-3">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Monto a retirar
                </span>
                <span className="text-xl font-bold tabular-nums text-primary">
                  {formatCurrency(
                    Number(cajaExcedente.efectivo_actual ?? 0) - Number(cajaExcedente.caja.monto_inicial),
                  )}
                </span>
              </div>

              <p className="flex justify-between text-sm text-muted-foreground">
                <span>Quedará en caja</span>
                <span className="tabular-nums">{formatCurrency(cajaExcedente.caja.monto_inicial)}</span>
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
    </div>
  )
}
