import { useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ArrowLeftRightIcon, HistoryIcon, PhoneIcon, WalletIcon, XIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableCard } from '@/components/TableCard'
import { CierreCajaForm } from '@/features/caja/components/CierreCajaForm'
import { ComprobanteRetiro } from '@/features/caja/components/ComprobanteRetiro'
import { MovimientoCajaForm } from '@/features/caja/components/MovimientoCajaForm'
import { MovimientosCajaTable } from '@/features/caja/components/MovimientosCajaTable'
import { useCajaActual } from '@/features/caja/hooks/useCajaActual'
import { useCerrarCaja, useCrearMovimientoCaja, useRetirarExcedenteCaja } from '@/features/caja/hooks/useCajaMutations'
import { useCajaMovimientos, useCajaResumen } from '@/features/caja/hooks/useCajaResumen'
import type { CierreFormValues, MovimientoCajaFormValues } from '@/features/caja/schemas/cajaSchema'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { VentaDetalleDialog } from '@/features/ventas/components/VentaDetalleDialog'
import { VentasTable } from '@/features/ventas/components/VentasTable'
import { useCrearVenta } from '@/features/ventas/hooks/useCrearVenta'
import { useVentas } from '@/features/ventas/hooks/useVentas'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatCurrency, formatTime } from '@/lib/format'
import { sumLineTotals } from '@/lib/lineItems'
import { usePagination } from '@/lib/hooks/usePagination'
import { cn } from '@/lib/utils'
import { listProductos, type ProductoConStock } from '@/services/productoService'
import { getUltimoRetiroExcedente, type VoucherRetiro } from '@/services/cajaService'
import type { FormaPago, Venta } from '@/services/ventaService'
import { useAuthStore } from '@/stores/authStore'

interface TicketLinea {
  producto: ProductoConStock
  cantidad: number
}

// Placeholder de acciones rápidas del kiosko: sin lógica todavía (llegan con OpenPay más
// adelante), pero ya reservan el espacio y la intención en la pantalla del cajero.
const ACCIONES_RAPIDAS = [
  { label: 'Recargas', icon: PhoneIcon },
  { label: 'Retiros', icon: WalletIcon },
  { label: 'Transferencias', icon: ArrowLeftRightIcon },
]

function lineaTotal(linea: TicketLinea): number {
  return Number(linea.producto.precio_venta) * linea.cantidad
}

function StatTile({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
      <p className={cn('font-semibold tabular-nums', emphasis ? 'text-primary' : 'text-foreground')}>{value}</p>
    </div>
  )
}

export function VentaKiosco() {
  // el Sheet de excedente se porta dentro del <main> del layout (no a document.body), así el
  // appbar de arriba queda siempre visible y usable por encima de la pantalla de bloqueo
  const { mainEl } = useOutletContext<{ mainEl: HTMLElement | null }>()
  const usuario = useAuthStore((state) => state.usuario)
  const puedeRetirarExcedente = usuario?.puede_retirar_excedente === true

  const [lineas, setLineas] = useState<TicketLinea[]>([])
  const [sku, setSku] = useState('')
  const [skuError, setSkuError] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [formaPago, setFormaPago] = useState<FormaPago>('efectivo')
  const [pagoCon, setPagoCon] = useState('')
  const [ticketNumero, setTicketNumero] = useState(1)
  const [historialOpen, setHistorialOpen] = useState(false)
  const [movimientosOpen, setMovimientosOpen] = useState(false)
  const [cierreOpen, setCierreOpen] = useState(false)
  const [excedenteOpen, setExcedenteOpen] = useState(false)
  const [voucher, setVoucher] = useState<VoucherRetiro | null>(null)
  const skuInputRef = useRef<HTMLInputElement>(null)
  // último comprobante ya mostrado en esta pantalla, para no reconstruirlo dos veces cuando el
  // propio cajero lo retira (voucher ya sale de la respuesta de la mutación al instante)
  const shownVoucherIdRef = useRef<number | null>(null)
  const excedePrevRef = useRef(false)

  const { data: cajaActual } = useCajaActual()
  const caja = cajaActual?.caja
  const { data: resumen } = useCajaResumen(caja?.id)
  const cerrar = useCerrarCaja()
  const retirarExcedente = useRetirarExcedenteCaja()
  const logout = useLogout()

  const crear = useCrearVenta()
  const total = sumLineTotals(lineas, lineaTotal)
  const cambio = Number(pagoCon || 0) - total
  // la venta que hace que la caja exceda el límite se permite; ninguna venta más (sea cual
  // sea la forma de pago) hasta que se retire el excedente — regla de negocio explícita
  const ventaBloqueada = cajaActual?.excede_limite === true
  const montoARetirar = Number(cajaActual?.efectivo_actual ?? 0) - Number(caja?.monto_inicial ?? 0)
  const puedeCobrar =
    lineas.length > 0 &&
    !ventaBloqueada &&
    (formaPago !== 'efectivo' || Number(pagoCon || 0) >= total) &&
    !crear.isPending

  async function buscarYAgregar() {
    const codigo = sku.trim()
    if (!codigo || buscando) return
    setBuscando(true)
    setSkuError(null)
    try {
      const { items } = await listProductos({ q: codigo, size: 5 })
      const producto = items.find((p) => p.sku.toLowerCase() === codigo.toLowerCase())
      if (!producto) {
        setSkuError('Producto no encontrado')
        return
      }
      setLineas((prev) => {
        const idx = prev.findIndex((l) => l.producto.id === producto.id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...next[idx], cantidad: next[idx].cantidad + 1 }
          return next
        }
        return [...prev, { producto, cantidad: 1 }]
      })
      setSku('')
    } catch {
      setSkuError('No se pudo buscar el producto')
    } finally {
      setBuscando(false)
      skuInputRef.current?.focus()
    }
  }

  function handleCantidad(productoId: number, cantidad: number) {
    setLineas((prev) => prev.map((l) => (l.producto.id === productoId ? { ...l, cantidad: Math.max(1, cantidad || 1) } : l)))
  }

  function handleQuitar(productoId: number) {
    setLineas((prev) => prev.filter((l) => l.producto.id !== productoId))
  }

  function cancelarTicket() {
    if (lineas.length === 0) return
    setLineas([])
    setFormaPago('efectivo')
    setPagoCon('')
    setTicketNumero((n) => n + 1)
    skuInputRef.current?.focus()
  }

  function handleCobrar() {
    if (!puedeCobrar) return
    crear.mutate(
      { items: lineas.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })), forma_pago: formaPago },
      {
        onSuccess: () => {
          setLineas([])
          setFormaPago('efectivo')
          setPagoCon('')
          setTicketNumero((n) => n + 1)
          skuInputRef.current?.focus()
        },
      },
    )
  }

  function handleTerminarTurno(values: CierreFormValues) {
    if (cerrar.isPending) return
    // "Terminar turno" es el corte + la salida del cajero en un solo paso: al cerrar la caja
    // ya no hay nada que bloquee el logout (el backend lo exige con caja cerrada), así que
    // encadenamos el logout apenas se confirma el cierre — vuelve directo al login.
    cerrar.mutate(values.monto_final, { onSuccess: () => logout.mutate() })
  }

  function handleRetirarExcedente() {
    if (retirarExcedente.isPending) return
    retirarExcedente.mutate(undefined, {
      onSuccess: (data) => {
        shownVoucherIdRef.current = data.movimiento_id
        setExcedenteOpen(false)
        setVoucher(data)
      },
    })
  }

  // se abre sola apenas la caja queda excedida — se siente como pantalla dedicada, no como
  // un panel que el cajero puede simplemente ignorar y seguir navegando
  useEffect(() => {
    const excede = cajaActual?.excede_limite === true
    if (excede) {
      setExcedenteOpen(true)
    } else if (excedePrevRef.current) {
      // se acaba de resolver. Si lo resolvió un admin desde otra sesión (ver docs/BACKEND.md),
      // este cajero nunca pasó por handleRetirarExcedente y no tiene el comprobante en mano —
      // lo reconstruye del servidor para poder mostrarlo/imprimirlo en la caja física donde
      // está el efectivo, que es de donde tiene que salir el comprobante.
      getUltimoRetiroExcedente().then((data) => {
        if (data && data.movimiento_id !== shownVoucherIdRef.current) {
          shownVoucherIdRef.current = data.movimiento_id
          setVoucher(data)
        }
      })
    }
    excedePrevRef.current = excede
  }, [cajaActual?.excede_limite])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (historialOpen || movimientosOpen || cierreOpen || excedenteOpen || voucher !== null) return
      if (e.key === 'F12') {
        e.preventDefault()
        handleCobrar()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelarTicket()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b bg-muted/30 px-6 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          {ACCIONES_RAPIDAS.map((accion) => (
            <Button key={accion.label} type="button" variant="outline" size="sm" disabled className="gap-1.5">
              <accion.icon className="size-4" />
              {accion.label}
              <Badge variant="secondary" className="text-[10px]">
                Próximamente
              </Badge>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-6">
          {resumen && (
            <>
              <StatTile label="Monto inicial" value={formatCurrency(resumen.caja.monto_inicial)} />
              <StatTile label="Ventas en efectivo" value={formatCurrency(resumen.total_ventas_efectivo)} />
              <StatTile label="Esperado en caja" value={formatCurrency(resumen.monto_esperado)} emphasis />
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setMovimientosOpen(true)}>
            Movimientos
          </Button>
          <Button variant="outline" size="sm" onClick={() => setHistorialOpen(true)}>
            <HistoryIcon /> Ventas del día
          </Button>
          <Button size="sm" onClick={() => setCierreOpen(true)}>
            Terminar turno
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-6 lg:min-h-0 lg:flex-1 lg:flex-row lg:overflow-hidden">
        <div className="flex flex-col gap-4 lg:min-h-0 lg:min-w-0 lg:flex-1 lg:overflow-hidden">
          <form
            className="flex shrink-0 flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              buscarYAgregar()
            }}
          >
            <Label htmlFor="sku-input" className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Código del producto
            </Label>
            <div className="flex gap-2">
              <Input
                id="sku-input"
                ref={skuInputRef}
                autoFocus
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value)
                  setSkuError(null)
                }}
                placeholder="Escanea o teclea el código y presiona Enter"
                className="h-12 text-base"
                aria-invalid={!!skuError}
              />
              <Button type="submit" size="lg" className="h-12 px-6" disabled={buscando || !sku.trim()}>
                Agregar
              </Button>
            </div>
            {skuError && (
              <p role="alert" className="text-sm text-destructive">
                {skuError}
              </p>
            )}
          </form>

          <div className="flex flex-col rounded-xl border bg-card shadow-sm lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {lineas.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 p-8 text-center">
                <h2 className="text-lg font-semibold">Ticket vacío</h2>
                <p className="text-sm text-muted-foreground">Escanea el primer producto para comenzar la venta.</p>
                <p className="text-sm text-muted-foreground">La caja está abierta y lista para cobrar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Cant.</TableHead>
                    <TableHead className="text-right">Importe</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineas.map((linea) => (
                    <TableRow key={linea.producto.id}>
                      <TableCell className="text-muted-foreground">{linea.producto.sku}</TableCell>
                      <TableCell className="font-medium">{linea.producto.nombre}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(linea.producto.precio_venta)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={1}
                          value={linea.cantidad}
                          onChange={(e) => handleCantidad(linea.producto.id, Number(e.target.value))}
                          className="ml-auto h-8 w-16 text-right tabular-nums"
                          aria-label={`Cantidad ${linea.producto.nombre}`}
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(lineaTotal(linea))}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Quitar ${linea.producto.nombre}`}
                          onClick={() => handleQuitar(linea.producto.id)}
                        >
                          <XIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {lineas.length} {lineas.length === 1 ? 'producto' : 'productos'} en la venta actual.
            </span>
            <span className="hidden sm:inline">Enter agrega · F12 cobra · Esc cancela el ticket</span>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 rounded-xl border bg-card p-5 shadow-sm lg:w-[340px] lg:overflow-y-auto">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            Ticket {String(ticketNumero).padStart(3, '0')}
          </p>

          <div className="border-t" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium tabular-nums">{formatCurrency(total)}</span>
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Forma de pago</Label>
            <Select value={formaPago} onValueChange={(value) => setFormaPago(value as FormaPago)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formaPago === 'efectivo' && (
            <div className="flex items-end justify-between gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Pagó con</Label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={pagoCon}
                  onChange={(e) => setPagoCon(e.target.value)}
                  className="text-right tabular-nums"
                  placeholder="0.00"
                />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Cambio</p>
                <p className={cn('font-semibold tabular-nums', cambio < 0 ? 'text-destructive' : 'text-foreground')}>
                  {formatCurrency(Math.abs(cambio))}
                </p>
              </div>
            </div>
          )}

          <div className="border-t pt-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Total a cobrar</p>
            <p className="text-[clamp(2rem,4vw,2.75rem)] font-bold tabular-nums">{formatCurrency(total)}</p>
          </div>

          <Button size="lg" className="h-12 text-base" disabled={!puedeCobrar} onClick={handleCobrar}>
            {crear.isPending ? 'Cobrando...' : 'Cobrar · F12'}
          </Button>
          <Button variant="outline" onClick={cancelarTicket} disabled={lineas.length === 0}>
            Cancelar ticket
          </Button>

          {crear.isError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(crear.error, 'No se pudo registrar la venta')}
            </p>
          )}
        </div>
      </div>

      <Dialog open={cierreOpen} onOpenChange={setCierreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminar turno</DialogTitle>
          </DialogHeader>
          <CierreCajaForm
            resumen={resumen}
            isPending={cerrar.isPending || logout.isPending}
            errorMessage={
              cerrar.isError
                ? getApiErrorMessage(cerrar.error, 'No se pudo cerrar la caja')
                : logout.isError
                  ? getApiErrorMessage(logout.error, 'Caja cerrada, pero no se pudo cerrar la sesión')
                  : undefined
            }
            onSubmit={handleTerminarTurno}
          />
        </DialogContent>
      </Dialog>

      <MovimientosDialog open={movimientosOpen} onOpenChange={setMovimientosOpen} cajaId={caja?.id} />
      <VentasDelDiaDialog open={historialOpen} onOpenChange={setHistorialOpen} />

      <Sheet
        open={excedenteOpen}
        onOpenChange={(open) => {
          // no se puede cerrar (Esc, click afuera) mientras la caja siga excedida — solo se
          // cierra explícitamente al confirmar el retiro (ver handleRetirarExcedente)
          if (open || !cajaActual?.excede_limite) setExcedenteOpen(open)
        }}
      >
        <SheetContent side="full" container={mainEl} showCloseButton={false} className="p-0">
          <div className="flex h-full flex-col overflow-y-auto md:flex-row">
            <div className="flex w-full flex-col justify-between gap-8 p-8 md:max-w-lg md:p-14">
              <div className="flex flex-col gap-4">
                <span className="inline-flex w-fit items-center rounded-sm bg-destructive px-2.5 py-1 text-xs font-bold tracking-widest text-destructive-foreground uppercase">
                  Cobro detenido
                </span>
                <h2 className="text-[clamp(2rem,4vw,3rem)] leading-[1.05] font-black tracking-tight">Caja excedida</h2>
                <p className="max-w-md text-muted-foreground">
                  {puedeRetirarExcedente
                    ? 'El efectivo acumulado superó el máximo permitido en esta terminal. Retira el excedente y entrégalo en bóveda para reanudar el cobro.'
                    : 'El efectivo acumulado superó el máximo permitido en esta terminal. No podrás cobrar hasta que un administrador retire el excedente.'}
                </p>
              </div>

              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <p>Política de la sucursal: máximo {formatCurrency(cajaActual?.limite_efectivo ?? '0')} en efectivo por terminal.</p>
                {caja && (
                  <p>
                    Caja de {caja.usuario_nombre} abierta desde las {formatTime(caja.fecha_apertura)} h.
                  </p>
                )}
              </div>
            </div>

            <div className="hidden w-px shrink-0 bg-border md:block" />

            <div className="flex w-full flex-1 flex-col gap-6 p-8 md:p-14">
              <div className="flex flex-col gap-1.5 border-b pb-5 text-sm tabular-nums">
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Efectivo acumulado en caja</span>
                  <span className="font-semibold">{formatCurrency(cajaActual?.efectivo_actual ?? '0')}</span>
                </p>
                <p className="flex justify-between">
                  <span className="text-muted-foreground">Máximo permitido por terminal</span>
                  <span className="font-semibold">{formatCurrency(cajaActual?.limite_efectivo ?? '0')}</span>
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Monto a retirar</p>
                <p className="text-[clamp(2.25rem,5vw,3.25rem)] leading-none font-black text-destructive tabular-nums">
                  {formatCurrency(montoARetirar)}
                </p>
              </div>

              <p className="flex justify-between border-t pt-4 text-sm tabular-nums">
                <span className="text-muted-foreground">Quedará en caja</span>
                <span className="font-semibold">{formatCurrency(caja?.monto_inicial ?? '0')}</span>
              </p>

              {retirarExcedente.isError && (
                <p role="alert" className="text-sm text-destructive">
                  {getApiErrorMessage(retirarExcedente.error, 'No se pudo retirar el excedente')}
                </p>
              )}

              {puedeRetirarExcedente ? (
                <div className="flex flex-col items-start gap-2 pt-2">
                  <Button size="lg" className="self-start px-6" onClick={handleRetirarExcedente} disabled={retirarExcedente.isPending}>
                    {retirarExcedente.isPending ? 'Retirando...' : `Confirmar retiro de ${formatCurrency(montoARetirar)}`}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Al confirmar se imprime el comprobante. Entrégalo en bóveda junto con el efectivo.
                  </p>
                </div>
              ) : (
                <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="font-semibold">Requiere autorización</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tu perfil no puede retirar efectivo. Un administrador debe hacer el retiro para que esta terminal
                    vuelva a cobrar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={voucher !== null} onOpenChange={(open) => !open && setVoucher(null)}>
        <SheetContent side="full" container={mainEl} showCloseButton={false} className="p-0">
          <div className="flex h-full flex-col overflow-y-auto md:flex-row">
            <div className="flex w-full flex-col justify-between gap-8 p-8 md:max-w-lg md:p-14">
              <div className="flex flex-col gap-4">
                <span className="text-xs font-bold tracking-widest text-destructive uppercase">Excedente de efectivo</span>
                <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] leading-[1.05] font-black tracking-tight">
                  Retiro registrado
                </h2>
                <p className="max-w-md text-muted-foreground">
                  La caja rebasó el máximo permitido de efectivo. El retiro quedó asentado; entrega el efectivo a
                  bóveda junto con el comprobante impreso.
                </p>
              </div>

              {voucher && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Máximo permitido</p>
                    <p className="font-semibold">{formatCurrency(cajaActual?.limite_efectivo ?? '0')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Excedente detectado</p>
                    <p className="font-semibold text-destructive">{formatCurrency(voucher.monto_retirado)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Folio</p>
                    <p className="font-semibold">#{String(voucher.movimiento_id).padStart(4, '0')}</p>
                  </div>
                  {voucher.autorizado_por !== voucher.cajero && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Autorizó</p>
                      <p className="font-semibold">{voucher.autorizado_por}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" onClick={() => window.print()}>
                    Imprimir comprobante
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => setVoucher(null)}>
                    Volver a ventas
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">El resto de la pantalla no aparece en el papel al imprimir.</p>
              </div>
            </div>

            <div className="hidden w-px shrink-0 bg-border md:block" />

            <div className="flex w-full flex-1 items-start justify-center overflow-y-auto p-8 md:p-14">
              {voucher && (
                <div className="w-full max-w-sm">
                  <ComprobanteRetiro voucher={voucher} />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function MovimientosDialog({
  open,
  onOpenChange,
  cajaId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cajaId: number | undefined
}) {
  const { page, size, setPage } = usePagination(10, open)
  const { data, isLoading, isError } = useCajaMovimientos(cajaId, page, size)
  const crearMovimiento = useCrearMovimientoCaja()
  const movimientos = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))

  function handleCrear(values: MovimientoCajaFormValues) {
    if (crearMovimiento.isPending) return
    crearMovimiento.mutate({ ...values, motivo: values.motivo || null })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Movimientos de caja</DialogTitle>
        </DialogHeader>
        <MovimientoCajaForm
          isPending={crearMovimiento.isPending}
          errorMessage={
            crearMovimiento.isError ? getApiErrorMessage(crearMovimiento.error, 'No se pudo registrar el movimiento') : undefined
          }
          onSubmit={handleCrear}
        />
        <div className="border-t pt-4">
          <TableCard isLoading={isLoading} isError={isError} page={page} pageCount={pageCount} total={total} onPageChange={setPage}>
            <MovimientosCajaTable movimientos={movimientos} />
          </TableCard>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function VentasDelDiaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { page, size, setPage } = usePagination(10, open)
  const { data, isLoading, isError } = useVentas(page, size)
  const [detalle, setDetalle] = useState<Venta | null>(null)
  const ventas = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ventas del día</DialogTitle>
          </DialogHeader>
          <TableCard isLoading={isLoading} isError={isError} page={page} pageCount={pageCount} total={total} onPageChange={setPage}>
            <VentasTable ventas={ventas} onVerDetalle={setDetalle} />
          </TableCard>
        </DialogContent>
      </Dialog>
      <VentaDetalleDialog venta={detalle} onClose={() => setDetalle(null)} />
    </>
  )
}
