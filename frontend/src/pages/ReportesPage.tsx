import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ErrorState, LoadingState } from '@/components/DataStates'
import { formatCurrency, formatDate } from '@/lib/format'
import { getCajasAbiertas, getVentasDia } from '@/services/reporteService'
import { useAuthStore } from '@/stores/authStore'

export function ReportesPage() {
  const [fecha, setFecha] = useState('')
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const {
    data: ventasDia,
    isLoading: isLoadingVentas,
    isError: isErrorVentas,
  } = useQuery({
    queryKey: ['reporte-ventas-dia', fecha],
    queryFn: () => getVentasDia(fecha || undefined),
    enabled: isAdmin,
  })
  const {
    data: cajasAbiertas,
    isLoading: isLoadingCajas,
    isError: isErrorCajas,
  } = useQuery({
    queryKey: ['cajas-abiertas'],
    queryFn: getCajasAbiertas,
    enabled: isAdmin,
  })

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Reportes</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex max-w-5xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Reportes</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Ventas del día</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="reporte-fecha" className="sr-only">
                Fecha
              </Label>
              <Input
                id="reporte-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-auto"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingVentas ? (
              <LoadingState />
            ) : isErrorVentas || !ventasDia ? (
              <ErrorState bordered={false} />
            ) : (
              <div className="flex flex-col gap-1 text-sm">
                <p className="text-muted-foreground">Fecha: {formatDate(ventasDia.fecha)}</p>
                <p className="text-2xl font-bold tracking-tight text-primary tabular-nums">
                  {formatCurrency(ventasDia.total_ventas)}
                </p>
                <p className="text-muted-foreground">{ventasDia.cantidad_ventas} ventas registradas</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cajas abiertas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingCajas ? (
              <LoadingState />
            ) : isErrorCajas || !cajasAbiertas ? (
              <ErrorState bordered={false} />
            ) : cajasAbiertas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ninguna caja abierta ahora mismo.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {cajasAbiertas.map((reporteCaja) => (
                  <div key={reporteCaja.caja.id} className="flex flex-col gap-1.5 border-b pb-4 text-sm last:border-b-0 last:pb-0">
                    <p className="font-medium text-foreground">
                      {reporteCaja.caja.usuario_nombre} · {reporteCaja.caja.equipo_nombre}
                    </p>
                    <p className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Monto inicial</span>{' '}
                      {formatCurrency(reporteCaja.caja.monto_inicial)}
                    </p>
                    <p className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Ventas en efectivo</span>{' '}
                      {formatCurrency(reporteCaja.total_ventas_efectivo)}
                    </p>
                    <p className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Otras entradas</span>{' '}
                      {formatCurrency(reporteCaja.total_entradas)}
                    </p>
                    <p className="flex justify-between tabular-nums">
                      <span className="text-muted-foreground">Otras salidas</span>{' '}
                      {formatCurrency(reporteCaja.total_salidas)}
                    </p>
                    <p className="flex justify-between border-t pt-1.5 text-base font-semibold tabular-nums text-primary">
                      <span className="font-medium text-foreground">Monto esperado</span>{' '}
                      {formatCurrency(reporteCaja.monto_esperado)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
