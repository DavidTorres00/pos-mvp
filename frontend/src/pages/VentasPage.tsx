import { useState } from 'react'

import { TableCard } from '@/components/TableCard'
import { VentaDetalleDialog } from '@/features/ventas/components/VentaDetalleDialog'
import { VentaKiosco } from '@/features/ventas/components/VentaKiosco'
import { VentasTable } from '@/features/ventas/components/VentasTable'
import { useVentas } from '@/features/ventas/hooks/useVentas'
import { usePagination } from '@/lib/hooks/usePagination'
import type { Venta } from '@/services/ventaService'
import { useAuthStore } from '@/stores/authStore'

export function VentasPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const [detalle, setDetalle] = useState<Venta | null>(null)

  const { page, size, setPage } = usePagination(10)
  const { data, isLoading, isError } = useVentas(page, size)
  const ventas = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))

  // el cajero tiene su propia pantalla de venta (kiosko, cobra y opera su caja): ver VentaKiosco.
  // el admin nunca puede registrar una venta (el backend exige caja abierta, y el admin no
  // abre caja) — para admin esta pantalla es solo historial/auditoría.
  if (usuario?.role === 'cajero') {
    return <VentaKiosco />
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Ventas</h1>

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <VentasTable ventas={ventas} onVerDetalle={setDetalle} />
      </TableCard>

      <VentaDetalleDialog venta={detalle} onClose={() => setDetalle(null)} />
    </div>
  )
}
