import { useQuery } from '@tanstack/react-query'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getReporteCaja, getVentasDia } from '@/services/reporteService'

export function ReportesPage() {
  const { data: ventasDia, isLoading: isLoadingVentas } = useQuery({
    queryKey: ['reporte-ventas-dia'],
    queryFn: getVentasDia,
  })
  const { data: reporteCaja, isLoading: isLoadingCaja } = useQuery({
    queryKey: ['reporte-caja'],
    queryFn: getReporteCaja,
    retry: false,
  })

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-lg font-semibold">Reportes</h1>

      <Card>
        <CardHeader>
          <CardTitle>Ventas del día</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingVentas || !ventasDia ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <div className="flex flex-col gap-1 text-sm">
              <p>Fecha: {ventasDia.fecha}</p>
              <p>Total vendido: ${ventasDia.total_ventas}</p>
              <p>Cantidad de ventas: {ventasDia.cantidad_ventas}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de caja {reporteCaja?.caja.abierta ? '(abierta)' : '(último cierre)'}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCaja ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : !reporteCaja ? (
            <p className="text-sm text-muted-foreground">Aún no hay ninguna caja registrada.</p>
          ) : (
            <div className="flex flex-col gap-1 text-sm">
              <p>Monto inicial: ${reporteCaja.caja.monto_inicial}</p>
              <p>Ventas en efectivo: ${reporteCaja.total_ventas_efectivo}</p>
              <p>Entradas manuales: ${reporteCaja.total_entradas}</p>
              <p>Salidas manuales: ${reporteCaja.total_salidas}</p>
              <p className="font-semibold">Monto esperado: ${reporteCaja.monto_esperado}</p>
              {reporteCaja.diferencia !== null && <p>Diferencia al cierre: ${reporteCaja.diferencia}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
