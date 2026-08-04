import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ErrorState } from '@/components/DataStates'
import { TableCard } from '@/components/TableCard'
import { OrdenesReordenTable } from '@/features/ordenes-reorden/components/OrdenesReordenTable'
import { useAprobarOrdenReorden, useRechazarOrdenReorden } from '@/features/ordenes-reorden/hooks/useOrdenReordenMutations'
import { useOrdenesReorden } from '@/features/ordenes-reorden/hooks/useOrdenesReorden'
import { getApiErrorMessage } from '@/lib/apiError'
import { usePagination } from '@/lib/hooks/usePagination'
import type { EstadoOrdenReorden } from '@/services/ordenReordenService'
import { useAuthStore } from '@/stores/authStore'

const ESTADOS: { value: EstadoOrdenReorden | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagada', label: 'Pagadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'error', label: 'Con error' },
]

export function OrdenesReordenPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')
  const [estado, setEstado] = useState<EstadoOrdenReorden | 'todos'>('pendiente')
  const { page, size, setPage } = usePagination(10, estado)
  const { data, isLoading, isError } = useOrdenesReorden(estado === 'todos' ? undefined : estado, page, size)
  const ordenes = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const aprobar = useAprobarOrdenReorden()
  const rechazar = useRechazarOrdenReorden()
  const hayFiltrosActivos = estado !== 'todos'

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Órdenes de reorden</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Órdenes de reorden</h1>
        <p className="text-sm text-muted-foreground">
          Sugeridas automáticamente al llegar al umbral de stock. Requieren tu aprobación antes de pagar.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select value={estado} onValueChange={(value) => setEstado(value as EstadoOrdenReorden | 'todos')}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hayFiltrosActivos && (
          <Button variant="ghost" onClick={() => setEstado('todos')}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {(aprobar.isError || rechazar.isError) && (
        <ErrorState message={getApiErrorMessage(aprobar.error ?? rechazar.error, 'No se pudo procesar la orden')} />
      )}

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <OrdenesReordenTable
          ordenes={ordenes}
          emptyMessage={hayFiltrosActivos ? 'No hay órdenes con este estado.' : 'No hay órdenes de reorden.'}
          onAprobar={(orden) => aprobar.mutate(orden.id)}
          onRechazar={(orden) => rechazar.mutate(orden.id)}
          aprobarPending={aprobar.isPending}
          rechazarPending={rechazar.isPending}
        />
      </TableCard>
    </div>
  )
}
