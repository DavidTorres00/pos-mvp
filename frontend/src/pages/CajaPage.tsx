import { useState } from 'react'
import { AlertTriangleIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { TableCard } from '@/components/TableCard'
import { CierreCajaForm } from '@/features/caja/components/CierreCajaForm'
import { MovimientoCajaForm } from '@/features/caja/components/MovimientoCajaForm'
import { MovimientosCajaTable } from '@/features/caja/components/MovimientosCajaTable'
import { VoucherRetiroDialog } from '@/features/caja/components/VoucherRetiroDialog'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useCerrarCaja, useCrearMovimientoCaja, useRetirarExcedenteCaja } from '@/features/caja/hooks/useCajaMutations'
import { useCajaMovimientos, useCajaResumen } from '@/features/caja/hooks/useCajaResumen'
import type { CierreFormValues, MovimientoCajaFormValues } from '@/features/caja/schemas/cajaSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { usePagination } from '@/lib/hooks/usePagination'
import type { VoucherRetiro } from '@/services/cajaService'
import { useAuthStore } from '@/stores/authStore'

export function CajaPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const puedeRetirarExcedente = usuario?.role === 'admin' || usuario?.puede_retirar_excedente === true
  const { data: cajaActual, isLoading, isError } = useCajaActual()
  const caja = cajaActual?.caja
  const { data: resumen, isError: isErrorResumen } = useCajaResumen(caja?.id)
  const { page, size, setPage } = usePagination(10)
  const {
    data: movimientosData,
    isLoading: isLoadingMovimientos,
    isError: isErrorMovimientos,
  } = useCajaMovimientos(caja?.id, page, size)
  const movimientos = movimientosData?.items ?? []
  const total = movimientosData?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const cerrar = useCerrarCaja()
  const crearMovimiento = useCrearMovimientoCaja()
  const retirarExcedente = useRetirarExcedenteCaja()
  const [movimientoOpen, setMovimientoOpen] = useState(false)
  const [cierreOpen, setCierreOpen] = useState(false)
  const [voucher, setVoucher] = useState<VoucherRetiro | null>(null)

  // apertura/operación diaria de caja es responsabilidad fija del cajero (ver AbrirCajaSplash);
  // el único caso real del admin acá es el corte de emergencia, y eso ya vive en Usuarios
  if (usuario?.role === 'admin') {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Caja</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">
          La apertura y operación de caja es responsabilidad del cajero. Si necesitas cerrar la caja de alguien que
          no puede hacerlo, hazlo desde{' '}
          <Link to="/usuarios" className="underline">
            Usuarios
          </Link>
          .
        </p>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (isError) {
    return <ErrorState />
  }

  // un cajero siempre llega aquí con caja abierta: AbrirCajaSplash se lo exige antes de dejarlo
  // pasar, y el caso admin ya se descartó arriba — caja nunca es null en este punto
  if (!caja) {
    return null
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">
          Caja abierta por {caja.usuario_nombre} desde {formatDateTime(caja.fecha_apertura)}
        </h1>
        <div className="flex gap-2">
          <Dialog open={movimientoOpen} onOpenChange={setMovimientoOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Registrar movimiento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar movimiento de caja</DialogTitle>
              </DialogHeader>
              <MovimientoCajaForm
                isPending={crearMovimiento.isPending}
                errorMessage={
                  crearMovimiento.isError
                    ? getApiErrorMessage(crearMovimiento.error, 'No se pudo registrar el movimiento')
                    : undefined
                }
                onSubmit={(values: MovimientoCajaFormValues) => {
                  if (crearMovimiento.isPending) return
                  crearMovimiento.mutate(
                    { ...values, motivo: values.motivo || null },
                    { onSuccess: () => setMovimientoOpen(false) },
                  )
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={cierreOpen} onOpenChange={setCierreOpen}>
            <DialogTrigger asChild>
              <Button>Cerrar caja</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cerrar caja</DialogTitle>
              </DialogHeader>
              <CierreCajaForm
                resumen={resumen}
                isPending={cerrar.isPending}
                errorMessage={cerrar.isError ? getApiErrorMessage(cerrar.error, 'No se pudo cerrar la caja') : undefined}
                onSubmit={(values: CierreFormValues) => {
                  if (cerrar.isPending) return
                  cerrar.mutate(values.monto_final, { onSuccess: () => setCierreOpen(false) })
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {cajaActual?.excede_limite && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 shrink-0 text-destructive" />
            <p>
              El efectivo en caja ({formatCurrency(cajaActual.efectivo_actual ?? '0')}) superó el límite configurado (
              {formatCurrency(cajaActual.limite_efectivo ?? '0')}).
            </p>
          </div>
          {puedeRetirarExcedente ? (
            <Button
              size="sm"
              disabled={retirarExcedente.isPending}
              onClick={() => retirarExcedente.mutate(undefined, { onSuccess: (data) => setVoucher(data) })}
            >
              Retirar excedente
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Pedile a un admin que retire el excedente.</span>
          )}
        </div>
      )}
      {retirarExcedente.isError && (
        <ErrorState message={getApiErrorMessage(retirarExcedente.error, 'No se pudo retirar el excedente')} />
      )}

      {isErrorResumen ? (
        <ErrorState message="No se pudo cargar el resumen de caja." />
      ) : (
        resumen && (
          <div className="flex flex-col gap-1.5 rounded-xl border bg-card p-4 text-sm shadow-sm">
            <p className="flex justify-between tabular-nums">
              <span className="text-muted-foreground">Monto inicial</span>{' '}
              {formatCurrency(resumen.caja.monto_inicial)}
            </p>
            <p className="flex justify-between tabular-nums">
              <span className="text-muted-foreground">Ventas en efectivo</span>{' '}
              {formatCurrency(resumen.total_ventas_efectivo)}
            </p>
            {Number(resumen.total_ventas_tarjeta) > 0 && (
              <p className="flex justify-between tabular-nums text-muted-foreground">
                <span>Ventas con tarjeta (no cuenta como efectivo)</span>
                {formatCurrency(resumen.total_ventas_tarjeta)}
              </p>
            )}
            {Number(resumen.total_ventas_transferencia) > 0 && (
              <p className="flex justify-between tabular-nums text-muted-foreground">
                <span>Ventas por transferencia (no cuenta como efectivo)</span>
                {formatCurrency(resumen.total_ventas_transferencia)}
              </p>
            )}
            <p className="flex justify-between border-t pt-1.5 text-base font-semibold tabular-nums text-primary">
              <span className="font-medium text-foreground">Monto esperado ahora</span>{' '}
              {formatCurrency(resumen.monto_esperado)}
            </p>
          </div>
        )
      )}

      <TableCard
        isLoading={isLoadingMovimientos}
        isError={isErrorMovimientos}
        errorMessage="No se pudieron cargar los movimientos de caja."
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <MovimientosCajaTable movimientos={movimientos} />
      </TableCard>

      <VoucherRetiroDialog voucher={voucher} onClose={() => setVoucher(null)} />
    </div>
  )
}
