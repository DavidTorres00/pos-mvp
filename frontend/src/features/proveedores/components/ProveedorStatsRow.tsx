import { StatCard } from '@/components/StatCard'

interface ProveedorStatsRowProps {
  totalProductos: number
  pedidosPendientes: number
}

export function ProveedorStatsRow({ totalProductos, pedidosPendientes }: ProveedorStatsRowProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatCard label="Productos que le compras" value={String(totalProductos)} />
      <StatCard label="Pedidos pendientes de aprobar" value={String(pedidosPendientes)} />
    </div>
  )
}
