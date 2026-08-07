import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/DataStates'
import { EntityActionsMenu } from '@/components/EntityActionsMenu'
import { MasterListAside } from '@/components/MasterListAside'
import { SucursalActivaSelector } from '@/components/SucursalActivaSelector'
import { TableCard } from '@/components/TableCard'
import { CategoriaForm } from '@/features/categorias/components/CategoriaForm'
import { CategoriaHeaderCard } from '@/features/categorias/components/CategoriaHeaderCard'
import { CategoriaStatsRow } from '@/features/categorias/components/CategoriaStatsRow'
import {
  useCrearCategoria,
  useSetEstadoCategoria,
  useUpdateCategoria,
} from '@/features/categorias/hooks/useCategoriaMutations'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import type { CategoriaFormValues } from '@/features/categorias/schemas/categoriaSchema'
import { ProductoForm } from '@/features/productos/components/ProductoForm'
import { ProductosTable } from '@/features/productos/components/ProductosTable'
import { useCrearProducto, useSetEstadoProducto, useUpdateProducto } from '@/features/productos/hooks/useProductoMutations'
import { useProductos } from '@/features/productos/hooks/useProductos'
import type { ProductoFormValues } from '@/features/productos/schemas/productoSchema'
import { SubcategoriasDialog } from '@/features/subcategorias/components/SubcategoriasDialog'
import { getApiErrorMessage } from '@/lib/apiError'
import { useCrudDialogState } from '@/lib/hooks/useCrudDialogState'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import { cn } from '@/lib/utils'
import type { CategoriaResumen } from '@/services/categoriaService'
import type { Producto } from '@/services/productoService'
import { useAuthStore } from '@/stores/authStore'
import { useSucursalActivaStore } from '@/stores/sucursalActivaStore'

export function ProductosPage() {
  const isAdmin = useAuthStore((state) => state.usuario?.role === 'admin')

  // llegada desde una alerta de stock del Dashboard ("Ver productos"): precarga esa sucursal en
  // el selector en vez de aterrizar en silencio en la que sea que estuviera activa — se captura
  // una sola vez al montar y se limpia la URL, mismo patrón que sucursalId/equipoId en
  // SucursalesPage (ver docs/FRONTEND.md)
  const [searchParams, setSearchParams] = useSearchParams()
  const setSucursalActiva = useSucursalActivaStore((state) => state.setSucursalId)
  useEffect(() => {
    const sucursalIdParam = searchParams.get('sucursalId')
    if (sucursalIdParam) {
      setSucursalActiva(Number(sucursalIdParam))
      setSearchParams({}, { replace: true })
    }
    // solo al montar: captura el estado inicial de la URL una vez, después la URL queda limpia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [categoriaSearch, setCategoriaSearch] = useState('')
  const debouncedCategoriaSearch = useDebouncedValue(categoriaSearch)
  // `null` = "sin elección explícita todavía" — la categoría efectiva cae a la primera de la
  // lista sin necesidad de sincronizar ese default con un efecto aparte
  const [categoriaElegidaId, setCategoriaElegidaId] = useState<number | null>(null)
  const sucursalActivaId = useSucursalActivaStore((state) => state.sucursalId)

  const {
    data: categoriasData,
    isLoading: isLoadingCategorias,
    isError: isErrorCategorias,
  } = useCategorias(debouncedCategoriaSearch, sucursalActivaId, 1, 100)
  const categorias = categoriasData?.items ?? []
  const seleccionadaId = categoriaElegidaId ?? categorias[0]?.id ?? null
  const seleccionada = categorias.find((c) => c.id === seleccionadaId) ?? null

  const categoriaDialog = useCrudDialogState<CategoriaResumen>()
  const crearCategoria = useCrearCategoria()
  const updateCategoria = useUpdateCategoria()
  const setEstadoCategoria = useSetEstadoCategoria()
  const [subcategoriasDe, setSubcategoriasDe] = useState<CategoriaResumen | null>(null)

  const [productoSearch, setProductoSearch] = useState('')
  const debouncedProductoSearch = useDebouncedValue(productoSearch)
  const { page, size, setPage } = usePagination(10, `${seleccionadaId ?? ''}-${debouncedProductoSearch}`)
  const {
    data: productosData,
    isLoading: isLoadingProductos,
    isError: isErrorProductos,
  } = useProductos({ q: debouncedProductoSearch, categoriaId: seleccionadaId }, page, size)
  const productos = productosData?.items ?? []
  const totalProductos = productosData?.total ?? 0
  const pageCountProductos = Math.max(1, Math.ceil(totalProductos / size))

  const productoDialog = useCrudDialogState<Producto>()
  const crearProducto = useCrearProducto()
  const updateProducto = useUpdateProducto()
  const setEstadoProducto = useSetEstadoProducto()

  const hayFiltrosProducto = productoSearch !== ''

  function handleCrearCategoria(values: CategoriaFormValues) {
    crearCategoria.mutate(values, { onSuccess: categoriaDialog.closeCreate })
  }

  function handleUpdateCategoria(values: CategoriaFormValues) {
    if (!categoriaDialog.editing) return
    updateCategoria.mutate({ id: categoriaDialog.editing.id, payload: values }, { onSuccess: categoriaDialog.closeEdit })
  }

  function handleCrearProducto(values: ProductoFormValues) {
    crearProducto.mutate(values, { onSuccess: productoDialog.closeCreate })
  }

  function handleUpdateProducto(values: ProductoFormValues) {
    if (!productoDialog.editing) return
    updateProducto.mutate({ id: productoDialog.editing.id, payload: values }, { onSuccess: productoDialog.closeEdit })
  }

  if (!isAdmin) {
    return (
      <div className="flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-xl font-semibold tracking-tight">Productos</h1>
        <p className="rounded-md border p-3 text-sm text-muted-foreground">No tienes acceso a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 p-6 lg:flex-row lg:items-start">
      <MasterListAside
        title="Categorías"
        headerAction={
          <Dialog open={categoriaDialog.createOpen} onOpenChange={categoriaDialog.setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Nueva categoría</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva categoría</DialogTitle>
              </DialogHeader>
              <CategoriaForm
                isPending={crearCategoria.isPending}
                errorMessage={
                  crearCategoria.isError
                    ? getApiErrorMessage(crearCategoria.error, 'No se pudo crear la categoría')
                    : undefined
                }
                onSubmit={handleCrearCategoria}
              />
            </DialogContent>
          </Dialog>
        }
        search={categoriaSearch}
        onSearchChange={setCategoriaSearch}
        onClearSearch={() => setCategoriaSearch('')}
        searchPlaceholder="Buscar por nombre..."
        searchAriaLabel="Buscar categorías"
        isLoading={isLoadingCategorias}
        isError={isErrorCategorias}
        items={categorias}
        emptyMessage="No hay categorías."
        getId={(c) => c.id}
        selectedId={seleccionadaId}
        onSelect={setCategoriaElegidaId}
        isItemAlert={(c) => c.productos_sin_stock > 0 || c.productos_stock_bajo > 0}
        renderItemActions={(c) => (
          <EntityActionsMenu
            triggerSize="icon-sm"
            extraActions={<DropdownMenuItem onSelect={() => setSubcategoriasDe(c)}>Subcategorías</DropdownMenuItem>}
            onEdit={() => categoriaDialog.edit(c)}
            activo={c.activo}
            onToggleEstado={() => setEstadoCategoria.mutate({ id: c.id, activo: !c.activo })}
            toggleDialogTitle={c.activo ? `¿Desactivar ${c.nombre}?` : `¿Activar ${c.nombre}?`}
            toggleDialogDescription={
              c.activo
                ? 'Sus productos y subcategorías seguirán existiendo, pero deja de estar disponible para clasificar productos nuevos.'
                : 'Volverá a estar disponible para clasificar productos y subcategorías.'
            }
          />
        )}
        renderItem={(c) => {
          const detalleAlerta = [
            c.productos_sin_stock > 0 && `${c.productos_sin_stock} sin stock`,
            c.productos_stock_bajo > 0 && `${c.productos_stock_bajo} stock bajo`,
          ]
            .filter(Boolean)
            .join(' · ')
          return (
            <>
              <span className={cn('font-medium', !c.activo && 'text-muted-foreground')}>{c.nombre}</span>
              <span className="text-xs text-muted-foreground">
                {c.total_subcategorias} {c.total_subcategorias === 1 ? 'subcategoría' : 'subcategorías'} ·{' '}
                {c.total_productos} {c.total_productos === 1 ? 'producto' : 'productos'}
              </span>
              {detalleAlerta && <span className="text-xs font-medium text-destructive">{detalleAlerta}</span>}
            </>
          )
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-4">
        {!seleccionada ? (
          <EmptyState message="Selecciona una categoría para ver su detalle." />
        ) : (
          <>
            <CategoriaHeaderCard categoria={seleccionada} sucursalSelector={<SucursalActivaSelector />} />

            <CategoriaStatsRow
              totalSubcategorias={seleccionada.total_subcategorias}
              totalProductos={seleccionada.total_productos}
            />

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Productos de {seleccionada.nombre}</h2>
                <div className="flex flex-wrap items-end gap-3">
                  <Dialog open={productoDialog.createOpen} onOpenChange={productoDialog.setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">Nuevo producto</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nuevo producto en {seleccionada.nombre}</DialogTitle>
                      </DialogHeader>
                      <ProductoForm
                        defaultCategoriaId={seleccionada.id}
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

              <TableCard
                isLoading={isLoadingProductos}
                isError={isErrorProductos}
                page={page}
                pageCount={pageCountProductos}
                total={totalProductos}
                onPageChange={setPage}
              >
                <ProductosTable
                  productos={productos}
                  canManage={isAdmin}
                  emptyMessage={
                    hayFiltrosProducto
                      ? 'No hay productos que coincidan con tu búsqueda.'
                      : 'No hay productos en esta categoría.'
                  }
                  onEdit={productoDialog.edit}
                  onToggleEstado={(producto) => setEstadoProducto.mutate({ id: producto.id, activo: !producto.activo })}
                />
              </TableCard>
            </div>
          </>
        )}
      </div>

      <Dialog open={categoriaDialog.editing !== null} onOpenChange={(open) => !open && categoriaDialog.closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoría</DialogTitle>
          </DialogHeader>
          {categoriaDialog.editing && (
            <CategoriaForm
              defaultValues={{ nombre: categoriaDialog.editing.nombre }}
              isPending={updateCategoria.isPending}
              errorMessage={
                updateCategoria.isError
                  ? getApiErrorMessage(updateCategoria.error, 'No se pudo actualizar la categoría')
                  : undefined
              }
              onSubmit={handleUpdateCategoria}
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

      <SubcategoriasDialog
        categoria={subcategoriasDe}
        isAdmin={isAdmin}
        onOpenChange={(open) => !open && setSubcategoriasDe(null)}
      />
    </div>
  )
}
