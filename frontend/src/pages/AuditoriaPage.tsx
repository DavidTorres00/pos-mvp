import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import { TableCard } from '@/components/TableCard'
import { useAuditoria } from '@/features/auditoria/hooks/useAuditoria'
import { formatDateTime } from '@/lib/format'
import { usePagination } from '@/lib/hooks/usePagination'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const ENTIDADES = [
  { value: 'usuario', label: 'Usuarios' },
  { value: 'producto', label: 'Productos' },
  { value: 'movimiento_inventario', label: 'Movimientos de inventario' },
  { value: 'caja_sesion', label: 'Caja (apertura/cierre)' },
  { value: 'movimiento_caja', label: 'Movimientos de caja' },
  { value: 'venta', label: 'Ventas' },
  { value: 'compra', label: 'Compras' },
  { value: 'proveedor', label: 'Proveedores' },
]

const ACCION_LABELS: Record<string, string> = {
  login_exitoso: 'Login exitoso',
  login_fallido: 'Login fallido',
  producto_creado: 'Producto creado',
  producto_precio_cambiado: 'Cambio de precio',
  producto_estado_cambiado: 'Cambio de estado',
  movimiento_inventario_registrado: 'Movimiento de inventario registrado',
  usuario_creado: 'Usuario creado',
  usuario_permisos_cambiados: 'Cambio de permisos de usuario',
  caja_abierta: 'Caja abierta',
  caja_cerrada: 'Caja cerrada',
  caja_movimiento_entrada: 'Entrada de efectivo',
  caja_movimiento_salida: 'Salida de efectivo',
  caja_retiro_excedente: 'Retiro de excedente',
  venta_registrada: 'Venta registrada',
  compra_creada: 'Pedido armado',
  compra_pagada: 'Pedido aprobado y pagado',
  compra_pago_error: 'Error al pagar un pedido',
  compra_rechazada: 'Pedido rechazado',
  compra_recibida: 'Pedido recibido en sucursal',
  proveedor_creado: 'Proveedor creado',
  proveedor_estado_cambiado: 'Cambio de estado de proveedor',
}

function formatDetalle(detalle: Record<string, unknown> | null): string {
  if (!detalle) return '—'
  return Object.entries(detalle)
    .map(([key, value]) => `${key}: ${value === null ? '—' : String(value)}`)
    .join(' · ')
}

export function AuditoriaPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  // llegada desde la alerta "Faltante en un cierre de caja" del Dashboard: precarga el filtro
  // que más probablemente muestre ese evento en la primera página, y lo resalta al encontrarlo
  const [searchParams] = useSearchParams()
  const highlightIdParam = searchParams.get('highlightId')
  const highlightId = highlightIdParam ? Number(highlightIdParam) : null
  const [entidad, setEntidad] = useState<string>(() => (highlightId !== null ? 'caja_sesion' : ''))
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const { page, size, setPage } = usePagination(20, `${entidad}-${desde}-${hasta}`)

  const { data, isLoading, isError } = useAuditoria(
    { entidad: entidad || undefined, desde: desde || undefined, hasta: hasta || undefined, page, size },
    isAdmin,
  )
  const eventos = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const hayFiltrosActivos = entidad !== '' || desde !== '' || hasta !== ''

  useEffect(() => {
    if (highlightId === null) return
    document.getElementById(`auditoria-evento-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, eventos.length])

  function limpiarFiltros() {
    setEntidad('')
    setDesde('')
    setHasta('')
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Auditoría</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Auditoría</h1>
      <p className="text-sm text-muted-foreground">Historial de quién hizo qué en el sistema.</p>

      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="auditoria-entidad">Módulo</Label>
          <Select value={entidad || 'todos'} onValueChange={(value) => setEntidad(value === 'todos' ? '' : value)}>
            <SelectTrigger id="auditoria-entidad" className="w-56">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ENTIDADES.map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="auditoria-desde">Desde</Label>
          <Input id="auditoria-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-auto" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="auditoria-hasta">Hasta</Label>
          <Input id="auditoria-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-auto" />
        </div>
        {hayFiltrosActivos && (
          <Button variant="ghost" onClick={limpiarFiltros}>
            Limpiar filtros
          </Button>
        )}
      </div>

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        {eventos.length === 0 ? (
          <EmptyState
            message={hayFiltrosActivos ? 'No hay eventos que coincidan con estos filtros.' : 'No hay eventos registrados.'}
            bordered={false}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eventos.map((evento) => (
                <TableRow
                  key={evento.id}
                  id={`auditoria-evento-${evento.id}`}
                  className={cn(evento.id === highlightId && 'bg-primary/10 outline outline-2 -outline-offset-2 outline-primary')}
                >
                  <TableCell className="whitespace-nowrap">{formatDateTime(evento.created_at)}</TableCell>
                  <TableCell>{evento.usuario?.nombre ?? '—'}</TableCell>
                  <TableCell>{ACCION_LABELS[evento.accion] ?? evento.accion}</TableCell>
                  <TableCell className="max-w-md truncate whitespace-normal text-muted-foreground">
                    {formatDetalle(evento.detalle)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TableCard>
    </div>
  )
}
