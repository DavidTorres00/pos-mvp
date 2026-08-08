import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangleIcon, PiggyBankIcon, WalletIcon } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { CajasAbiertasLista } from '@/features/dashboard/components/CajasAbiertasLista'
import { SucursalCard } from '@/features/dashboard/components/SucursalCard'
import { SucursalTabs } from '@/features/dashboard/components/SucursalTabs'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { getAtencion, getCajasAbiertas, getResumenSucursales } from '@/services/reporteService'
import { useAuthStore } from '@/stores/authStore'

interface StatTileProps {
  label: string
  value: string
  hint: string
  valueClassName?: string
  icon: typeof WalletIcon
}

function StatTile({ label, value, hint, valueClassName, icon: Icon }: StatTileProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={cn('text-3xl font-bold tracking-tight tabular-nums', valueClassName ?? 'text-primary')}>
          {value}
        </p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

// solo admin llega aquí: el cajero cae directo en /ventas (ver ProtectedLayout), nunca ve Dashboard
export function DashboardPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<number | null>(null)

  const {
    data: resumenSucursales,
    isLoading: isLoadingSucursales,
    isError: isErrorSucursales,
  } = useQuery({ queryKey: ['resumen-sucursales'], queryFn: getResumenSucursales })
  const {
    data: cajasAbiertas,
    isLoading: isLoadingCajas,
    isError: isErrorCajas,
  } = useQuery({ queryKey: ['cajas-abiertas'], queryFn: getCajasAbiertas })
  const {
    data: atencion,
    isLoading: isLoadingAtencion,
    isError: isErrorAtencion,
  } = useQuery({ queryKey: ['reportes-atencion'], queryFn: getAtencion })

  const sucursales = resumenSucursales ?? []

  // el filtro de sucursal es puramente client-side sobre datos ya globales (ver docs/FRONTEND.md):
  // evita agregar sucursal_id a cada endpoint solo para esta vista de "un vistazo"
  const nombreSeleccionada =
    sucursalSeleccionada === null
      ? null
      : (sucursales.find((s) => s.sucursal_id === sucursalSeleccionada)?.sucursal_nombre ?? null)

  const resumenesFiltrados =
    sucursalSeleccionada === null ? sucursales : sucursales.filter((s) => s.sucursal_id === sucursalSeleccionada)
  const cajasFiltradas =
    nombreSeleccionada === null
      ? (cajasAbiertas ?? [])
      : (cajasAbiertas ?? []).filter((c) => c.caja.sucursal_nombre === nombreSeleccionada)

  const ventasHoyTotal = resumenesFiltrados.reduce((sum, r) => sum + Number(r.ventas_hoy), 0)
  const cantidadVentasHoy = resumenesFiltrados.reduce((sum, r) => sum + r.cantidad_ventas_hoy, 0)
  const efectivoEsperadoTotal = resumenesFiltrados.reduce((sum, r) => sum + Number(r.efectivo_esperado), 0)
  const cajasExcedidasTotal = resumenesFiltrados.reduce((sum, r) => sum + r.cajas_excedidas, 0)

  const statsLoading = isLoadingSucursales || isLoadingCajas || isLoadingAtencion
  const statsError = isErrorSucursales || isErrorCajas || isErrorAtencion

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hola, {usuario?.nombre ?? 'de nuevo'}</h1>
          <p className="text-sm text-muted-foreground">Esto es lo que pasa hoy en tu negocio.</p>
        </div>
        <SucursalTabs sucursales={sucursales} seleccionada={sucursalSeleccionada} onSeleccionar={setSucursalSeleccionada} />
      </div>

      {statsLoading ? (
        <div className="rounded-xl border p-6">
          <LoadingState />
        </div>
      ) : statsError ? (
        <div className="rounded-xl border p-6">
          <ErrorState bordered={false} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatTile
            label="Ventas de hoy"
            value={formatCurrency(ventasHoyTotal)}
            hint={`${cantidadVentasHoy} ${cantidadVentasHoy === 1 ? 'venta registrada' : 'ventas registradas'}`}
            icon={WalletIcon}
          />
          <StatTile
            label="Efectivo esperado en cajas"
            value={formatCurrency(efectivoEsperadoTotal)}
            hint={`${cajasFiltradas.length} ${cajasFiltradas.length === 1 ? 'caja abierta' : 'cajas abiertas'}`}
            icon={PiggyBankIcon}
          />
          <StatTile
            label="Cajas sobre el límite"
            value={String(cajasExcedidasTotal)}
            hint="Detienen el cobro hasta retirar el excedente"
            valueClassName={cajasExcedidasTotal > 0 ? 'text-destructive' : 'text-primary'}
            icon={AlertTriangleIcon}
          />
        </div>
      )}

      {/* con 1 sola sucursal esta card repetiría exactamente lo que ya dicen los stat tiles de
          arriba (mismos números, misma sucursal) — ver docs/FRONTEND.md */}
      {sucursales.length > 1 && resumenesFiltrados.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Sucursales</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {resumenesFiltrados.map((resumen) => (
              <SucursalCard
                key={resumen.sucursal_id}
                resumen={resumen}
                alertas={(atencion ?? []).filter((a) => a.sucursal_id === resumen.sucursal_id)}
              />
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cajas abiertas ahora</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCajas ? (
            <LoadingState />
          ) : isErrorCajas ? (
            <ErrorState bordered={false} />
          ) : (
            <CajasAbiertasLista resumenes={cajasFiltradas} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
