import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { DownloadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MasterListAside } from '@/components/MasterListAside'
import { StatCard } from '@/components/StatCard'
import { TableCard } from '@/components/TableCard'
import { MasVendidosCard } from '@/features/ventas/components/MasVendidosCard'
import { RequierenDecisionCard } from '@/features/ventas/components/RequierenDecisionCard'
import { SucursalRankingCard } from '@/features/ventas/components/SucursalRankingCard'
import { VentaDetalleDialog } from '@/features/ventas/components/VentaDetalleDialog'
import { VentaKiosco } from '@/features/ventas/components/VentaKiosco'
import { VentasPorDiaChart } from '@/features/ventas/components/VentasPorDiaChart'
import { VentasTable } from '@/features/ventas/components/VentasTable'
import { useAcusarAlerta } from '@/features/dashboard/hooks/useAcusarAlerta'
import { useMasVendidos } from '@/features/ventas/hooks/useMasVendidos'
import { useResumenVentas } from '@/features/ventas/hooks/useResumenVentas'
import { useVentas } from '@/features/ventas/hooks/useVentas'
import { useVentasPorDia } from '@/features/ventas/hooks/useVentasPorDia'
import { useVentasPorSucursal } from '@/features/ventas/hooks/useVentasPorSucursal'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import { useUsuarios } from '@/features/usuarios/hooks/useUsuarios'
import { usePagination } from '@/lib/hooks/usePagination'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { getAtencion, getResumenSucursales, type Alerta } from '@/services/reporteService'
import { FORMA_PAGO_LABELS, listVentas, type FormaPago, type Venta } from '@/services/ventaService'
import { useAuthStore } from '@/stores/authStore'

// sentinel fuera del rango real de ids de Sucursal (autoincremental, siempre > 0) — representa
// "todas las sucursales" como una fila más de la lista maestra, en vez de un Select aparte.
const TODAS_ID = 0
const MAX_FILAS_EXPORTAR = 2000

function toYMD(fecha: Date): string {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

function fromYMD(valor: string): Date {
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Date(anio, mes - 1, dia)
}

function addDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha)
  copia.setDate(copia.getDate() + dias)
  return copia
}

const PRESETS: { label: string; calcular: () => { desde: string; hasta: string } }[] = [
  { label: 'Hoy', calcular: () => ({ desde: toYMD(new Date()), hasta: toYMD(new Date()) }) },
  { label: 'Ayer', calcular: () => ({ desde: toYMD(addDias(new Date(), -1)), hasta: toYMD(addDias(new Date(), -1)) }) },
  { label: '7 días', calcular: () => ({ desde: toYMD(addDias(new Date(), -6)), hasta: toYMD(new Date()) }) },
  { label: '30 días', calcular: () => ({ desde: toYMD(addDias(new Date(), -29)), hasta: toYMD(new Date()) }) },
  {
    label: 'Mes actual',
    calcular: () => {
      const hoy = new Date()
      return { desde: toYMD(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: toYMD(hoy) }
    },
  },
]

// mismo largo de rango, inmediatamente antes — para la variación % de los stat tiles
function periodoAnterior(desde: string, hasta: string): { desde: string; hasta: string } {
  const inicio = fromYMD(desde)
  const fin = fromYMD(hasta)
  const duracionDias = Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const finAnterior = addDias(inicio, -1)
  const inicioAnterior = addDias(finAnterior, -(duracionDias - 1))
  return { desde: toYMD(inicioAnterior), hasta: toYMD(finAnterior) }
}

// sin base real de comparación (período anterior en cero) no se muestra delta — "creció infinito
// %" no es un dato honesto que mostrarle al admin
function calcularDelta(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

export function VentasPage() {
  const usuario = useAuthStore((state) => state.usuario)
  // el cajero también monta este componente (el branch a VentaKiosco es un `return` que ocurre
  // después de que los hooks ya corrieron, por reglas de React) — sin este guard, cada query
  // admin-only de aquí abajo se disparaba igual para el cajero y el backend las rechazaba con
  // 403 en cada reload del kiosko (RBAC correcto, pero ruido de queries que nunca debieron salir)
  const isAdmin = usuario?.role === 'admin'
  const [detalle, setDetalle] = useState<Venta | null>(null)
  const [exportando, setExportando] = useState(false)

  const [search, setSearch] = useState('')
  const [sucursalId, setSucursalId] = useState(TODAS_ID)

  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [formaPago, setFormaPago] = useState<FormaPago | ''>('')
  const [cajeroId, setCajeroId] = useState<number | ''>('')
  const hayFiltrosActivos = desde !== '' || hasta !== '' || formaPago !== '' || cajeroId !== ''

  function limpiarFiltros() {
    setDesde('')
    setHasta('')
    setFormaPago('')
    setCajeroId('')
  }

  const {
    data: sucursalesData,
    isLoading: isLoadingSucursales,
    isError: isErrorSucursales,
  } = useSucursales('', 1, 100, isAdmin)
  const sucursales = sucursalesData?.items.filter((s) => s.activo) ?? []
  const seleccionada = sucursales.find((s) => s.id === sucursalId) ?? null
  const { data: resumenesSucursales } = useQuery({
    queryKey: ['resumen-sucursales'],
    queryFn: getResumenSucursales,
    enabled: isAdmin,
  })
  const { data: cajerosData } = useUsuarios(1, 100, isAdmin)
  const cajeros = cajerosData?.items ?? []

  const itemsAside = [{ id: TODAS_ID, nombre: 'Todas las sucursales' }, ...sucursales]
  const itemsFiltrados = itemsAside.filter((item) => item.nombre.toLowerCase().includes(search.toLowerCase()))
  // admin de una sola sucursal (ver docs/FRONTEND.md): no hay nada real que elegir entre "Todas"
  // y esa única sucursal — misma vista dos veces — así que ni se muestra el maestro ni se deja
  // en TODAS_ID, se preselecciona directo para que el título/columnas/filtros ya reflejen la
  // única sucursal desde el primer render
  const mostrarMaestro = sucursales.length > 1
  const primeraSucursalId = sucursales[0]?.id
  useEffect(() => {
    if (sucursales.length === 1 && sucursalId === TODAS_ID && primeraSucursalId !== undefined) {
      setSucursalId(primeraSucursalId)
    }
  }, [sucursales.length, primeraSucursalId, sucursalId])

  const filtrosActivos = {
    desde,
    hasta,
    formaPago: formaPago || undefined,
    sucursalId: sucursalId || undefined,
    usuarioId: cajeroId || undefined,
  }
  const { page, size, setPage } = usePagination(10, `${desde}-${hasta}-${formaPago}-${sucursalId}-${cajeroId}`)
  const { data, isLoading, isError } = useVentas(filtrosActivos, page, size, isAdmin)
  const ventas = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))

  const { data: resumenVentas } = useResumenVentas(filtrosActivos, isAdmin)
  const hayRangoAcotado = desde !== '' && hasta !== ''
  const filtrosAnterior = hayRangoAcotado
    ? { ...periodoAnterior(desde, hasta), formaPago: formaPago || undefined, sucursalId: sucursalId || undefined, usuarioId: cajeroId || undefined }
    : {}
  const { data: resumenAnterior } = useResumenVentas(filtrosAnterior, isAdmin && hayRangoAcotado)

  const { data: masVendidos } = useMasVendidos(filtrosActivos, isAdmin)
  const { data: ventasPorDia } = useVentasPorDia(filtrosActivos, isAdmin)
  // ranking de sucursales: solo aporta algo con "Todas las sucursales" elegida — con una sola
  // seleccionada sería la misma cifra que ya muestran los KPIs de arriba
  const verRankingSucursales = isAdmin && sucursalId === TODAS_ID
  const { data: ventasPorSucursal } = useVentasPorSucursal(
    { desde, hasta, formaPago: formaPago || undefined, usuarioId: cajeroId || undefined },
    verRankingSucursales,
  )

  const { data: atencionTodas } = useQuery({ queryKey: ['reportes-atencion'], queryFn: getAtencion, enabled: isAdmin })
  const alertasFiltradas =
    sucursalId === TODAS_ID
      ? (atencionTodas ?? [])
      : (atencionTodas ?? []).filter((a) => a.sucursal_id === null || a.sucursal_id === sucursalId)
  const acusarAlerta = useAcusarAlerta()
  function handleAcusar(alerta: Alerta) {
    if (alerta.auditoria_id === null || acusarAlerta.isPending) return
    acusarAlerta.mutate({ tipo: alerta.tipo, referenciaId: alerta.auditoria_id })
  }

  async function exportarCSV() {
    if (exportando) return
    setExportando(true)
    try {
      const primera = await listVentas({ ...filtrosActivos, page: 1, size: 100 })
      const filasDisponibles = Math.min(primera.total, MAX_FILAS_EXPORTAR)
      const totalPaginas = Math.max(1, Math.ceil(filasDisponibles / 100))
      const todas = [...primera.items]
      for (let p = 2; p <= totalPaginas; p++) {
        const resp = await listVentas({ ...filtrosActivos, page: p, size: 100 })
        todas.push(...resp.items)
      }
      const encabezado = ['Folio', 'Fecha', 'Sucursal', 'Cajero', 'Total', 'Forma de pago']
      const filas = todas.map((v) => [
        v.id,
        formatDateTime(v.created_at),
        v.sucursal_nombre,
        v.usuario_nombre,
        v.total,
        FORMA_PAGO_LABELS[v.forma_pago],
      ])
      const lineas = [encabezado, ...filas].map((fila) =>
        fila.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(','),
      )
      if (primera.total > todas.length) {
        lineas.push(
          `"Mostrando ${todas.length} de ${primera.total} ventas que coinciden con el filtro — acota el rango de fechas para exportar el resto."`,
        )
      }
      const csv = `﻿${lineas.join('\n')}`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const enlace = document.createElement('a')
      enlace.href = url
      enlace.download = `ventas_${toYMD(new Date())}.csv`
      enlace.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportando(false)
    }
  }

  // el cajero tiene su propia pantalla de venta (kiosko, cobra y opera su caja): ver VentaKiosco.
  // el admin nunca puede registrar una venta (el backend exige caja abierta, y el admin no
  // abre caja) — para admin esta pantalla es solo historial/auditoría.
  if (usuario?.role === 'cajero') {
    return <VentaKiosco />
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6 lg:flex-row lg:items-start">
      {mostrarMaestro && (
        <MasterListAside
          title="Sucursales"
          search={search}
          onSearchChange={setSearch}
          onClearSearch={() => setSearch('')}
          searchPlaceholder="Buscar por nombre..."
          searchAriaLabel="Buscar sucursales"
          isLoading={isLoadingSucursales}
          isError={isErrorSucursales}
          items={itemsFiltrados}
          emptyMessage="No hay sucursales."
          getId={(item) => item.id}
          selectedId={sucursalId}
          onSelect={setSucursalId}
          renderItem={(item) => {
            if (item.id === TODAS_ID) {
              const ventasHoy = (resumenesSucursales ?? []).reduce((sum, r) => sum + Number(r.ventas_hoy), 0)
              return (
                <>
                  <span className="font-medium">{item.nombre}</span>
                  <span className="text-xs text-muted-foreground">{formatCurrency(ventasHoy)} hoy</span>
                </>
              )
            }
            const resumen = resumenesSucursales?.find((r) => r.sucursal_id === item.id)
            return (
              <>
                <span className="font-medium">{item.nombre}</span>
                <span className="text-xs text-muted-foreground">
                  {resumen ? `${formatCurrency(resumen.ventas_hoy)} hoy` : '—'}
                </span>
              </>
            )
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {sucursalId === TODAS_ID ? 'Todas las sucursales' : seleccionada?.nombre}
            </h1>
            {seleccionada?.direccion && <p className="text-sm text-muted-foreground">{seleccionada.direccion}</p>}
          </div>
          <Button variant="outline" size="sm" onClick={exportarCSV} disabled={exportando} className="gap-1.5">
            <DownloadIcon className="size-4" />
            {exportando ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => {
                const rango = preset.calcular()
                setDesde(rango.desde)
                setHasta(rango.hasta)
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ventas-desde">Desde</Label>
            <Input
              id="ventas-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ventas-hasta">Hasta</Label>
            <Input
              id="ventas-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ventas-forma-pago" className="sr-only">
              Forma de pago
            </Label>
            <Select
              value={formaPago || 'todas'}
              onValueChange={(value) => setFormaPago(value === 'todas' ? '' : (value as FormaPago))}
            >
              <SelectTrigger id="ventas-forma-pago" className="w-40 shrink-0">
                <SelectValue placeholder="Forma de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {Object.entries(FORMA_PAGO_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ventas-cajero" className="sr-only">
              Cajero
            </Label>
            <Select
              value={cajeroId === '' ? 'todos' : String(cajeroId)}
              onValueChange={(value) => setCajeroId(value === 'todos' ? '' : Number(value))}
            >
              <SelectTrigger id="ventas-cajero" className="w-44 shrink-0">
                <SelectValue placeholder="Cajero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los cajeros</SelectItem>
                {cajeros.map((cajero) => (
                  <SelectItem key={cajero.id} value={String(cajero.id)}>
                    {cajero.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hayFiltrosActivos && (
            <Button variant="ghost" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Ventas"
            value={formatCurrency(resumenVentas?.total_neto ?? '0')}
            deltaPct={hayRangoAcotado ? calcularDelta(Number(resumenVentas?.total_neto ?? 0), Number(resumenAnterior?.total_neto ?? 0)) : undefined}
          />
          <StatCard
            label="Utilidad"
            value={formatCurrency(resumenVentas?.utilidad_total ?? '0')}
            deltaPct={hayRangoAcotado ? calcularDelta(Number(resumenVentas?.utilidad_total ?? 0), Number(resumenAnterior?.utilidad_total ?? 0)) : undefined}
          />
          <StatCard
            label="Margen"
            value={resumenVentas?.margen_pct != null ? `${Number(resumenVentas.margen_pct).toFixed(1)}%` : 'Sin datos'}
          />
          <StatCard
            label="Tickets"
            value={String(resumenVentas?.cantidad ?? 0)}
            deltaPct={hayRangoAcotado ? calcularDelta(resumenVentas?.cantidad ?? 0, resumenAnterior?.cantidad ?? 0) : undefined}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-muted-foreground">Tendencia</h2>
          <VentasPorDiaChart datos={ventasPorDia ?? []} />
        </div>

        {verRankingSucursales && <SucursalRankingCard items={ventasPorSucursal ?? []} />}

        <div className="grid items-start gap-4 lg:grid-cols-2">
          <MasVendidosCard items={masVendidos ?? []} />
          <RequierenDecisionCard
            alertas={alertasFiltradas}
            onAcusar={handleAcusar}
            acusandoAuditoriaId={acusarAlerta.isPending ? (acusarAlerta.variables?.referenciaId ?? null) : null}
            devolucionesMonto={resumenVentas?.devoluciones_monto ?? '0'}
            devolucionesCantidad={resumenVentas?.devoluciones_cantidad ?? 0}
            cancelacionesMonto={resumenVentas?.cancelaciones_monto ?? '0'}
            cancelacionesCantidad={resumenVentas?.cancelaciones_cantidad ?? 0}
          />
        </div>

        <TableCard
          isLoading={isLoading}
          isError={isError}
          page={page}
          pageCount={pageCount}
          total={total}
          onPageChange={setPage}
        >
          <VentasTable
            ventas={ventas}
            onVerDetalle={setDetalle}
            showSucursal={sucursalId === TODAS_ID}
            emptyMessage={
              hayFiltrosActivos ? 'No hay ventas que coincidan con tu búsqueda.' : 'No hay ventas registradas.'
            }
          />
        </TableCard>
      </div>

      <VentaDetalleDialog venta={detalle} onClose={() => setDetalle(null)} />
    </div>
  )
}
