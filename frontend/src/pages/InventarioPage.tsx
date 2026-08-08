import { InfoIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SucursalActivaSelector } from '@/components/SucursalActivaSelector'
import { TableCard } from '@/components/TableCard'
import { MovimientoForm } from '@/features/inventario/components/MovimientoForm'
import { MovimientosTable } from '@/features/inventario/components/MovimientosTable'
import { useCrearMovimiento } from '@/features/inventario/hooks/useCrearMovimiento'
import { useMovimientos } from '@/features/inventario/hooks/useMovimientos'
import type { MovimientoFormValues } from '@/features/inventario/schemas/movimientoSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { TipoMovimiento } from '@/services/inventarioService'
import { useAuthStore } from '@/stores/authStore'

export function InventarioPage() {
  const [open, setOpen] = useState(false)
  const [avisoVisible, setAvisoVisible] = useState(true)
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const [search, setSearch] = useState('')
  const [tipo, setTipo] = useState<TipoMovimiento | ''>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const { page, size, setPage } = usePagination(10, `${debouncedSearch}-${tipo}-${desde}-${hasta}`)
  const { data, isLoading, isError } = useMovimientos(
    { q: debouncedSearch, tipo: tipo || undefined, desde, hasta },
    page,
    size,
    isAdmin,
  )
  const movimientos = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const crear = useCrearMovimiento()
  const hayFiltrosActivos = search !== '' || tipo !== '' || desde !== '' || hasta !== ''

  function limpiarFiltros() {
    setSearch('')
    setTipo('')
    setDesde('')
    setHasta('')
  }

  function handleSubmit(values: MovimientoFormValues) {
    crear.mutate({ ...values, motivo: values.motivo || null }, { onSuccess: () => setOpen(false) })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>

      {avisoVisible && (
        <div className="flex items-start justify-between gap-3 rounded-lg border bg-primary/5 p-3 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <InfoIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              Usa esta sección solo para ajustes manuales de stock (conteo físico, merma, producto dañado, carga
              inicial). Si compraste a un proveedor, registralo en Compras; si fue una venta, en Ventas — ambos
              actualizan el stock automáticamente.
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Cerrar aviso" onClick={() => setAvisoVisible(false)}>
            <XIcon />
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-end gap-3">
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm"
            aria-label="Buscar movimientos"
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="inventario-tipo" className="sr-only">
              Tipo
            </Label>
            <Select
              value={tipo || 'todos'}
              onValueChange={(value) => setTipo(value === 'todos' ? '' : (value as TipoMovimiento))}
            >
              <SelectTrigger id="inventario-tipo" className="w-40 shrink-0">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex shrink-0 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="inventario-desde">Desde</Label>
              <Input
                id="inventario-desde"
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inventario-hasta">Hasta</Label>
              <Input
                id="inventario-hasta"
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
          {hayFiltrosActivos && (
            <Button variant="ghost" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          )}
          <SucursalActivaSelector />
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Registrar movimiento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar movimiento</DialogTitle>
            </DialogHeader>
            <MovimientoForm
              isPending={crear.isPending}
              errorMessage={
                crear.isError ? getApiErrorMessage(crear.error, 'No se pudo registrar el movimiento') : undefined
              }
              onSubmit={handleSubmit}
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
        <MovimientosTable
          movimientos={movimientos}
          emptyMessage={
            hayFiltrosActivos
              ? 'No hay movimientos que coincidan con tu búsqueda.'
              : 'No hay movimientos registrados.'
          }
        />
      </TableCard>
    </div>
  )
}
