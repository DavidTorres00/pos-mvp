import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/DataStates'
import { MasterListAside } from '@/components/MasterListAside'
import { TableCard } from '@/components/TableCard'
import { CompraForm } from '@/features/compras/components/CompraForm'
import { PedidosTable } from '@/features/compras/components/PedidosTable'
import { RecibirPedidoForm } from '@/features/compras/components/RecibirPedidoForm'
import { useAprobarCompra, useRechazarCompra, useRecibirCompra } from '@/features/compras/hooks/useCompraMutations'
import { useCompras } from '@/features/compras/hooks/useCompras'
import { useCrearCompra } from '@/features/compras/hooks/useCrearCompra'
import type { CompraFormValues } from '@/features/compras/schemas/compraSchema'
import { ProductoForm } from '@/features/productos/components/ProductoForm'
import { ProductosTable } from '@/features/productos/components/ProductosTable'
import { useCrearProducto, useSetEstadoProducto, useUpdateProducto } from '@/features/productos/hooks/useProductoMutations'
import { useProductos } from '@/features/productos/hooks/useProductos'
import type { ProductoFormValues } from '@/features/productos/schemas/productoSchema'
import { ProveedorForm } from '@/features/proveedores/components/ProveedorForm'
import { ProveedorHeaderCard } from '@/features/proveedores/components/ProveedorHeaderCard'
import { ProveedorStatsRow } from '@/features/proveedores/components/ProveedorStatsRow'
import {
  useCrearProveedor,
  useSetEstadoProveedor,
  useUpdateProveedor,
} from '@/features/proveedores/hooks/useProveedorMutations'
import { useProveedores } from '@/features/proveedores/hooks/useProveedores'
import type { ProveedorFormValues } from '@/features/proveedores/schemas/proveedorSchema'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Compra, RecibirCompraItemPayload } from '@/services/compraService'
import type { Producto } from '@/services/productoService'
import type { ProveedorResumen } from '@/services/proveedorService'
import { useAuthStore } from '@/stores/authStore'

export function ProveedoresPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  const [proveedorSearch, setProveedorSearch] = useState('')
  const debouncedProveedorSearch = useDebouncedValue(proveedorSearch)
  // `null` = "sin elección explícita todavía" — el proveedor efectivo cae al primero de la
  // lista sin necesidad de sincronizar ese default con un efecto aparte (mismo criterio que
  // ProductosPage/categoriaElegidaId)
  const [proveedorElegidoId, setProveedorElegidoId] = useState<number | null>(null)

  const {
    data: proveedoresData,
    isLoading: isLoadingProveedores,
    isError: isErrorProveedores,
  } = useProveedores(debouncedProveedorSearch, 1, 100)
  const proveedores = proveedoresData?.items ?? []
  const seleccionadaId = proveedorElegidoId ?? proveedores[0]?.id ?? null
  const seleccionada = proveedores.find((p) => p.id === seleccionadaId) ?? null

  const proveedorDialog = useCrudDialogState<ProveedorResumen>()
  const crearProveedor = useCrearProveedor()
  const updateProveedor = useUpdateProveedor()
  const setEstadoProveedor = useSetEstadoProveedor()

  const [productoSearch, setProductoSearch] = useState('')
  const debouncedProductoSearch = useDebouncedValue(productoSearch)
  const { page: prodPage, size: prodSize, setPage: setProdPage } = usePagination(
    10,
    `${seleccionadaId ?? ''}-${debouncedProductoSearch}`,
  )
  const {
    data: productosData,
    isLoading: isLoadingProductos,
    isError: isErrorProductos,
  } = useProductos({ q: debouncedProductoSearch, proveedorId: seleccionadaId }, prodPage, prodSize)
  const productos = productosData?.items ?? []
  const totalProductos = productosData?.total ?? 0
  const pageCountProductos = Math.max(1, Math.ceil(totalProductos / prodSize))
  const hayFiltrosProducto = productoSearch !== ''

  const productoDialog = useCrudDialogState<Producto>()
  const crearProducto = useCrearProducto()
  const updateProducto = useUpdateProducto()
  const setEstadoProducto = useSetEstadoProducto()

  // selección para el bulk "Preparar pedido" — vive scopeada a un solo proveedor por
  // construcción (esta tabla ya está filtrada por proveedorId), así nunca se puede mezclar
  // productos de proveedores distintos en un mismo pedido (ver docs/FRONTEND.md)
  const [seleccionProductos, setSeleccionProductos] = useState<Set<number>>(new Set())
  useEffect(() => setSeleccionProductos(new Set()), [seleccionadaId])
  function toggleSeleccionProducto(id: number) {
    setSeleccionProductos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const { page: pedidoPage, size: pedidoSize, setPage: setPedidoPage } = usePagination(10, seleccionadaId ?? '')
  const {
    data: pedidosData,
    isLoading: isLoadingPedidos,
    isError: isErrorPedidos,
  } = useCompras(seleccionadaId, pedidoPage, pedidoSize, seleccionadaId !== null)
  const pedidos = pedidosData?.items ?? []
  const totalPedidos = pedidosData?.total ?? 0
  const pageCountPedidos = Math.max(1, Math.ceil(totalPedidos / pedidoSize))

  const crearCompra = useCrearCompra()
  const aprobarCompra = useAprobarCompra()
  const rechazarCompra = useRechazarCompra()
  const recibirCompra = useRecibirCompra()

  const [pedidoDialogOpen, setPedidoDialogOpen] = useState(false)
  const [bulkPedidoOpen, setBulkPedidoOpen] = useState(false)
  const [detallePedido, setDetallePedido] = useState<Compra | null>(null)
  const [recibiendoPedido, setRecibiendoPedido] = useState<Compra | null>(null)

  function handleCrearProveedor(values: ProveedorFormValues) {
    crearProveedor.mutate(values, { onSuccess: proveedorDialog.closeCreate })
  }

  function handleUpdateProveedor(values: ProveedorFormValues) {
    if (!proveedorDialog.editing) return
    updateProveedor.mutate(
      { id: proveedorDialog.editing.id, payload: values },
      { onSuccess: proveedorDialog.closeEdit },
    )
  }

  function handleCrearProducto(values: ProductoFormValues) {
    crearProducto.mutate(values, { onSuccess: productoDialog.closeCreate })
  }

  function handleUpdateProducto(values: ProductoFormValues) {
    if (!productoDialog.editing) return
    updateProducto.mutate({ id: productoDialog.editing.id, payload: values }, { onSuccess: productoDialog.closeEdit })
  }

  function handleCrearPedido(values: CompraFormValues) {
    if (crearCompra.isPending) return
    const payload = {
      proveedor_id: values.proveedor_id as number,
      items: values.items.map((item) => ({ ...item, producto_id: item.producto_id as number })),
    }
    crearCompra.mutate(payload, {
      onSuccess: () => {
        setPedidoDialogOpen(false)
        setBulkPedidoOpen(false)
        setSeleccionProductos(new Set())
      },
    })
  }

  function handleRecibirPedido(items: RecibirCompraItemPayload[]) {
    if (!recibiendoPedido || recibirCompra.isPending) return
    recibirCompra.mutate({ id: recibiendoPedido.id, items }, { onSuccess: () => setRecibiendoPedido(null) })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Proveedores</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6 lg:flex-row lg:items-start">
      <MasterListAside
        title="Proveedores"
        headerAction={
          <Dialog open={proveedorDialog.createOpen} onOpenChange={proveedorDialog.setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Nuevo proveedor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo proveedor</DialogTitle>
              </DialogHeader>
              <ProveedorForm
                isPending={crearProveedor.isPending}
                errorMessage={
                  crearProveedor.isError
                    ? getApiErrorMessage(crearProveedor.error, 'No se pudo crear el proveedor')
                    : undefined
                }
                onSubmit={handleCrearProveedor}
              />
            </DialogContent>
          </Dialog>
        }
        search={proveedorSearch}
        onSearchChange={setProveedorSearch}
        onClearSearch={() => setProveedorSearch('')}
        searchPlaceholder="Buscar por nombre..."
        searchAriaLabel="Buscar proveedores"
        isLoading={isLoadingProveedores}
        isError={isErrorProveedores}
        items={proveedores}
        emptyMessage="No hay proveedores."
        getId={(p) => p.id}
        selectedId={seleccionadaId}
        onSelect={setProveedorElegidoId}
        renderItem={(p) => (
          <>
            <span className={cn('font-medium', !p.activo && 'text-muted-foreground')}>{p.nombre}</span>
            <span className="text-xs text-muted-foreground">
              {p.total_productos} {p.total_productos === 1 ? 'producto' : 'productos'}
              {p.pedidos_pendientes > 0 && ` · ${p.pedidos_pendientes} pendiente${p.pedidos_pendientes === 1 ? '' : 's'}`}
            </span>
          </>
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {!seleccionada ? (
          <EmptyState message="Selecciona un proveedor para ver su detalle." />
        ) : (
          <>
            <ProveedorHeaderCard
              proveedor={seleccionada}
              onEdit={() => proveedorDialog.edit(seleccionada)}
              onToggleEstado={() => setEstadoProveedor.mutate({ id: seleccionada.id, activo: !seleccionada.activo })}
            />

            <ProveedorStatsRow
              totalProductos={seleccionada.total_productos}
              pedidosPendientes={seleccionada.pedidos_pendientes}
            />

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Productos de {seleccionada.nombre}</h2>
                <Dialog open={productoDialog.createOpen} onOpenChange={productoDialog.setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Nuevo producto</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo producto de {seleccionada.nombre}</DialogTitle>
                    </DialogHeader>
                    <ProductoForm
                      defaultProveedorId={seleccionada.id}
                      isPending={crearProducto.isPending}
                      errorMessage={
                        crearProducto.isError
                          ? getApiErrorMessage(crearProducto.error, 'No se pudo crear el producto')
                          : undefined
                      }
                      onSubmit={handleCrearProducto}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por nombre o SKU..."
                  value={productoSearch}
                  onChange={(e) => setProductoSearch(e.target.value)}
                  className="w-full max-w-sm"
                  aria-label="Buscar productos"
                />
                {hayFiltrosProducto && (
                  <Button variant="ghost" size="sm" onClick={() => setProductoSearch('')}>
                    Limpiar
                  </Button>
                )}
              </div>

              {seleccionProductos.size > 0 && (
                <div className="flex items-center justify-between rounded-md bg-primary/5 p-3 text-sm">
                  <span>
                    {seleccionProductos.size} {seleccionProductos.size === 1 ? 'seleccionado' : 'seleccionados'}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSeleccionProductos(new Set())}>
                      Cancelar selección
                    </Button>
                    <Button size="sm" onClick={() => setBulkPedidoOpen(true)}>
                      Preparar pedido
                    </Button>
                  </div>
                </div>
              )}

              <TableCard
                isLoading={isLoadingProductos}
                isError={isErrorProductos}
                page={prodPage}
                pageCount={pageCountProductos}
                total={totalProductos}
                onPageChange={setProdPage}
              >
                <ProductosTable
                  productos={productos}
                  canManage={isAdmin}
                  showProveedor={false}
                  selectedIds={seleccionProductos}
                  onToggleSelect={toggleSeleccionProducto}
                  emptyMessage={
                    hayFiltrosProducto
                      ? 'No hay productos que coincidan con tu búsqueda.'
                      : 'No hay productos asignados a este proveedor.'
                  }
                  onEdit={productoDialog.edit}
                  onToggleEstado={(producto) => setEstadoProducto.mutate({ id: producto.id, activo: !producto.activo })}
                />
              </TableCard>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">Pedidos a {seleccionada.nombre}</h2>
                <Dialog open={pedidoDialogOpen} onOpenChange={setPedidoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Nuevo pedido</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nuevo pedido a {seleccionada.nombre}</DialogTitle>
                    </DialogHeader>
                    <CompraForm
                      proveedorFijo={{ id: seleccionada.id, nombre: seleccionada.nombre }}
                      isPending={crearCompra.isPending}
                      errorMessage={
                        crearCompra.isError ? getApiErrorMessage(crearCompra.error, 'No se pudo armar el pedido') : undefined
                      }
                      onSubmit={handleCrearPedido}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              <TableCard
                isLoading={isLoadingPedidos}
                isError={isErrorPedidos}
                page={pedidoPage}
                pageCount={pageCountPedidos}
                total={totalPedidos}
                onPageChange={setPedidoPage}
              >
                <PedidosTable
                  pedidos={pedidos}
                  showProveedor={false}
                  emptyMessage="No hay pedidos a este proveedor."
                  onVerDetalle={setDetallePedido}
                  onAprobar={(pedido) => aprobarCompra.mutate(pedido.id)}
                  onRechazar={(pedido) => rechazarCompra.mutate(pedido.id)}
                  onRecibir={setRecibiendoPedido}
                  aprobandoId={aprobarCompra.isPending ? aprobarCompra.variables : null}
                  rechazandoId={rechazarCompra.isPending ? rechazarCompra.variables : null}
                />
              </TableCard>
            </div>
          </>
        )}
      </div>

      <Dialog open={proveedorDialog.editing !== null} onOpenChange={(open) => !open && proveedorDialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
          </DialogHeader>
          {proveedorDialog.editing && (
            <ProveedorForm
              defaultValues={{
                nombre: proveedorDialog.editing.nombre,
                contacto: proveedorDialog.editing.contacto ?? '',
                telefono: proveedorDialog.editing.telefono ?? '',
                email: proveedorDialog.editing.email ?? '',
                clabe: proveedorDialog.editing.clabe ?? '',
              }}
              isPending={updateProveedor.isPending}
              errorMessage={
                updateProveedor.isError
                  ? getApiErrorMessage(updateProveedor.error, 'No se pudo actualizar el proveedor')
                  : undefined
              }
              onSubmit={handleUpdateProveedor}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={productoDialog.editing !== null} onOpenChange={(open) => !open && productoDialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {productoDialog.editing && (
            <ProductoForm
              defaultValues={{
                nombre: productoDialog.editing.nombre,
                sku: productoDialog.editing.sku,
                precio_venta: Number(productoDialog.editing.precio_venta),
                categoria_id: productoDialog.editing.categoria_id,
                subcategoria_id: productoDialog.editing.subcategoria_id,
                proveedor_id: productoDialog.editing.proveedor_id,
              }}
              isPending={updateProducto.isPending}
              errorMessage={
                updateProducto.isError
                  ? getApiErrorMessage(updateProducto.error, 'No se pudo actualizar el producto')
                  : undefined
              }
              onSubmit={handleUpdateProducto}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={bulkPedidoOpen} onOpenChange={setBulkPedidoOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preparar pedido a {seleccionada?.nombre}</DialogTitle>
          </DialogHeader>
          {seleccionada && (
            <CompraForm
              key={Array.from(seleccionProductos).join(',')}
              proveedorFijo={{ id: seleccionada.id, nombre: seleccionada.nombre }}
              defaultProductoIds={Array.from(seleccionProductos)}
              isPending={crearCompra.isPending}
              errorMessage={
                crearCompra.isError ? getApiErrorMessage(crearCompra.error, 'No se pudo armar el pedido') : undefined
              }
              onSubmit={handleCrearPedido}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detallePedido !== null} onOpenChange={(open) => !open && setDetallePedido(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalle del pedido</DialogTitle>
          </DialogHeader>
          {detallePedido && (
            <div className="flex flex-col gap-2 text-sm">
              <p>Proveedor: {detallePedido.proveedor.nombre}</p>
              <p>Armado por: {detallePedido.usuario.nombre}</p>
              <p>Fecha: {formatDateTime(detallePedido.created_at)}</p>
              <ul className="flex flex-col gap-1">
                {detallePedido.items.map((item) => (
                  <li key={item.id}>
                    {item.producto.nombre} — {item.cantidad} x {formatCurrency(item.costo_unitario)} ={' '}
                    {formatCurrency(item.subtotal)}
                    {item.cantidad_recibida !== null && item.cantidad_recibida !== item.cantidad && (
                      <span className="text-muted-foreground"> (recibido: {item.cantidad_recibida})</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="border-t pt-2 text-base font-semibold tabular-nums text-foreground">
                Total: <span className="text-primary">{formatCurrency(detallePedido.total)}</span>
              </p>
              {detallePedido.aprobado_por && (
                <p className="text-xs text-muted-foreground">
                  Pagado por {detallePedido.aprobado_por.nombre}
                  {detallePedido.aprobado_at && ` el ${formatDateTime(detallePedido.aprobado_at)}`}
                </p>
              )}
              {detallePedido.recibido_por && (
                <p className="text-xs text-muted-foreground">
                  Recibido por {detallePedido.recibido_por.nombre}
                  {detallePedido.recibido_at && ` el ${formatDateTime(detallePedido.recibido_at)}`}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={recibiendoPedido !== null} onOpenChange={(open) => !open && setRecibiendoPedido(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recepción del pedido</DialogTitle>
          </DialogHeader>
          {recibiendoPedido && (
            <RecibirPedidoForm
              pedido={recibiendoPedido}
              isPending={recibirCompra.isPending}
              errorMessage={
                recibirCompra.isError
                  ? getApiErrorMessage(recibirCompra.error, 'No se pudo registrar la recepción')
                  : undefined
              }
              onSubmit={handleRecibirPedido}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
