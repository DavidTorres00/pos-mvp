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
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useCajaResumen } from '@/features/caja/hooks/useCajaResumen'
import { formatCurrency } from '@/lib/format'
import { getVentasDia } from '@/services/reporteService'
import { useAuthStore } from '@/stores/authStore'

const MODULOS = [
  { to: '/productos', label: 'Productos', description: 'Catálogo y precios', icon: PackageIcon, adminOnly: false },
  { to: '/categorias', label: 'Categorías', description: 'Organiza tu catálogo', icon: TagIcon, adminOnly: true },
  { to: '/inventario', label: 'Inventario', description: 'Entradas y salidas de stock', icon: BoxesIcon, adminOnly: true },
  {
    to: '/compras',
    label: 'Compras',
    description: 'Registra compras a proveedores',
    icon: ShoppingCartIcon,
    adminOnly: true,
  },
  { to: '/ventas', label: 'Ventas', description: 'Registra ventas del día', icon: ReceiptIcon, adminOnly: false },
  { to: '/reportes', label: 'Reportes', description: 'Resumen de ventas y caja', icon: BarChart3Icon, adminOnly: true },
]

export function DashboardPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const isAdmin = usuario?.role === 'admin'
  const { data: ventasDia, isLoading: isLoadingVentas } = useQuery({
    queryKey: ['reporte-ventas-dia'],
    queryFn: () => getVentasDia(),
    enabled: isAdmin,
  })
  const { data: cajaActual, isLoading: isLoadingCaja } = useCajaActual()
  const caja = cajaActual?.caja
  const { data: resumen } = useCajaResumen(caja?.id)

  const ticketPromedio =
    ventasDia && ventasDia.cantidad_ventas > 0 ? Number(ventasDia.total_ventas) / ventasDia.cantidad_ventas : null

  const desglose = resumen
    ? [
        { label: 'Ventas en efectivo', value: Number(resumen.total_ventas_efectivo), color: 'bg-primary' },
        { label: 'Entradas manuales', value: Number(resumen.total_entradas), color: 'bg-success' },
        { label: 'Salidas manuales', value: Number(resumen.total_salidas), color: 'bg-destructive' },
      ]
    : []
  const desgloseTotal = desglose.reduce((sum, item) => sum + Math.abs(item.value), 0)

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
            {!isAdmin ? (
              <p className="text-sm text-muted-foreground">Disponible solo para administradores.</p>
            ) : isLoadingVentas || !ventasDia ? (
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
            {isLoadingCaja ? (
              <LoadingState />
            ) : !caja ? (
              <p className="text-sm text-muted-foreground">
                No hay caja abierta.{' '}
                <Link to="/caja" className="font-medium text-primary underline underline-offset-2">
                  Abrir caja
                </Link>
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <p className="text-3xl font-bold tracking-tight text-primary tabular-nums">
                    {formatCurrency(resumen?.monto_esperado ?? caja.monto_inicial)}
                  </p>
                  <p className="text-sm text-muted-foreground">Monto esperado en caja abierta</p>
                </div>

                {resumen && desgloseTotal > 0 && (
                  <div className="flex h-1.5 overflow-hidden rounded-full bg-muted">
                    {desglose.map((item) =>
                      item.value > 0 ? (
                        <div
                          key={item.label}
                          className={item.color}
                          style={{ width: `${(item.value / desgloseTotal) * 100}%` }}
                          title={`${item.label}: ${formatCurrency(item.value)}`}
                        />
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {MODULOS.filter((modulo) => !modulo.adminOnly || isAdmin).map((modulo) => (
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
