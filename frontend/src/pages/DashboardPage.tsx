import { useQuery } from '@tanstack/react-query'
import {
  ArrowRightIcon,
  BarChart3Icon,
  BoxesIcon,
  PackageIcon,
  PiggyBankIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  TagIcon,
  WalletIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/DataStates'
import { formatCurrency } from '@/lib/format'
import { getCajasAbiertas, getVentasDia } from '@/services/reporteService'
import { useAuthStore } from '@/stores/authStore'

// solo admin llega aquí: el cajero cae directo en /ventas (ver ProtectedLayout), nunca ve Dashboard
const MODULOS = [
  { to: '/productos', label: 'Productos', description: 'Catálogo y precios', icon: PackageIcon },
  { to: '/categorias', label: 'Categorías', description: 'Organiza tu catálogo', icon: TagIcon },
  { to: '/inventario', label: 'Inventario', description: 'Entradas y salidas de stock', icon: BoxesIcon },
  { to: '/compras', label: 'Compras', description: 'Registra compras a proveedores', icon: ShoppingCartIcon },
  { to: '/ventas', label: 'Ventas', description: 'Historial y auditoría de ventas', icon: ReceiptIcon },
  { to: '/reportes', label: 'Reportes', description: 'Resumen de ventas y caja', icon: BarChart3Icon },
]

export function DashboardPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const { data: ventasDia, isLoading: isLoadingVentas } = useQuery({
    queryKey: ['reporte-ventas-dia'],
    queryFn: () => getVentasDia(),
  })
  const { data: cajasAbiertas, isLoading: isLoadingCajasAbiertas } = useQuery({
    queryKey: ['cajas-abiertas'],
    queryFn: getCajasAbiertas,
  })
  const totalEsperadoCajasAbiertas = (cajasAbiertas ?? []).reduce((sum, c) => sum + Number(c.monto_esperado), 0)

  const ticketPromedio =
    ventasDia && ventasDia.cantidad_ventas > 0 ? Number(ventasDia.total_ventas) / ventasDia.cantidad_ventas : null

  return (
    <div className="flex w-full flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {usuario?.nombre ?? 'de nuevo'}</h1>
        <p className="text-sm text-muted-foreground">Esto es lo que pasa hoy en tu negocio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Ventas de hoy</CardTitle>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <WalletIcon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoadingVentas || !ventasDia ? (
              <LoadingState />
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tracking-tight text-primary tabular-nums">
                  {formatCurrency(ventasDia.total_ventas)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {ventasDia.cantidad_ventas} ventas registradas
                  {ticketPromedio !== null && ` · ticket promedio ${formatCurrency(ticketPromedio)}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Estado de caja</CardTitle>
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PiggyBankIcon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            {isLoadingCajasAbiertas ? (
              <LoadingState />
            ) : !cajasAbiertas || cajasAbiertas.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay ninguna caja abierta ahora mismo.</p>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tracking-tight text-primary tabular-nums">
                  {formatCurrency(totalEsperadoCajasAbiertas)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Esperado en total · {cajasAbiertas.length} {cajasAbiertas.length === 1 ? 'caja abierta' : 'cajas abiertas'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {MODULOS.map((modulo) => (
            <Link
              key={modulo.to}
              to={modulo.to}
              className="group flex items-center justify-between rounded-xl border bg-card p-4 text-sm shadow-sm ring-1 ring-foreground/8 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/20"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <modulo.icon className="size-4.5" />
                </span>
                <div>
                  <p className="font-semibold">{modulo.label}</p>
                  <p className="text-muted-foreground">{modulo.description}</p>
                </div>
              </div>
              <ArrowRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
