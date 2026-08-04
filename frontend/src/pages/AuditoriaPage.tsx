import { useState } from 'react'

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
  { value: 'regla_reorden', label: 'Reglas de reorden' },
  { value: 'orden_reorden', label: 'Órdenes de reorden' },
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
  compra_registrada: 'Compra registrada',
  proveedor_creado: 'Proveedor creado',
  proveedor_estado_cambiado: 'Cambio de estado de proveedor',
  regla_reorden_creada: 'Regla de reorden creada',
  regla_reorden_estado_cambiado: 'Cambio de estado de regla',
  orden_reorden_disparada: 'Orden de reorden sugerida',
  orden_reorden_aprobada: 'Orden de reorden aprobada',
  orden_reorden_rechazada: 'Orden de reorden rechazada',
  pago_proveedor_aprobado: 'Pago a proveedor realizado',
  pago_proveedor_error: 'Error al pagar a proveedor',
}

function formatDetalle(detalle: Record<string, unknown> | null): string {
  if (!detalle) return '—'
  return Object.entries(detalle)
    .map(([key, value]) => `${key}: ${value === null ? '—' : String(value)}`)
    .join(' · ')
}

export function AuditoriaPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const [entidad, setEntidad] = useState<string>('')
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
                <TableRow key={evento.id}>
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
