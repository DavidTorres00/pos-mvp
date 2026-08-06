import { useEffect, useRef, useState, type KeyboardEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCard } from '@/components/TableCard'
import { ProductosParaVentaTable } from '@/features/ventas/components/ProductosParaVentaTable'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { usePagination } from '@/lib/hooks/usePagination'
import type { ProductoConStock } from '@/services/productoService'

interface ProductoPickerPanelProps {
  onAgregar: (producto: ProductoConStock) => void
  onClose: () => void
}

// Panel "Productos" del cajero: navegación/consulta del catálogo activo, con acción directa
// para agregar a la venta en curso (ver VentaKiosco, que registra `onAgregar` vía
// `agregarProductoRef` del layout). Antes reusaba `ProductosPage` (admin) tal cual, con
// columnas y acciones de gestión que al cajero no le sirven (Categoría, Estado, Editar).
export function ProductoPickerPanel({ onAgregar, onClose }: ProductoPickerPanelProps) {
  const [search, setSearch] = useState('')
  const [agregadoId, setAgregadoId] = useState<number | null>(null)
  const debouncedSearch = useDebouncedValue(search)
  const { page, size, setPage } = usePagination(10, debouncedSearch)
  // activo: true — el cajero nunca debe ver ni poder agregar un producto dado de baja
  const { data, isLoading, isError } = useProductos(debouncedSearch, page, size, true)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const productos = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / size))
  const hayFiltrosActivos = search !== ''

  // Enfocar el input apenas monta (`autoFocus`) lo hace mientras el panel todavía está a mitad
  // de la animación de entrada (`translate-x`, ver sheetVariants) — el elemento está fuera de
  // cuadro en ese instante, y el navegador puede intentar revelarlo con un scroll correctivo
  // apenas la animación termina. Se difiere el foco hasta que el `slide-in` (300ms) ya terminó.
  useEffect(() => {
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 320)
    return () => window.clearTimeout(id)
  }, [])

  function handleAgregar(producto: ProductoConStock) {
    onAgregar(producto)
    setAgregadoId(producto.id)
    window.setTimeout(() => setAgregadoId((id) => (id === producto.id ? null : id)), 1200)
  }

  // El input también sirve como entrada de escáner de código de barras: un lector "teclea" el
  // código y envía Enter — si hay una coincidencia exacta de SKU en la página actual, se agrega
  // directo al ticket sin que el cajero tenga que ubicar la fila y hacer clic en "Agregar".
  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const codigo = search.trim().toLowerCase()
    if (!codigo) return
    const exacto = productos.find((p) => p.sku.toLowerCase() === codigo)
    if (!exacto) return
    e.preventDefault()
    handleAgregar(exacto)
    setSearch('')
    searchInputRef.current?.focus()
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <h2 className="font-heading text-lg font-semibold tracking-tight">Productos</h2>

      <Input
        ref={searchInputRef}
        placeholder="Buscar o escanear por nombre o SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleSearchKeyDown}
        aria-label="Buscar productos"
      />

      <TableCard
        isLoading={isLoading}
        isError={isError}
        page={page}
        pageCount={pageCount}
        total={total}
        onPageChange={setPage}
      >
        <ProductosParaVentaTable
          productos={productos}
          emptyMessage={hayFiltrosActivos ? 'No hay productos que coincidan con tu búsqueda.' : 'No hay productos.'}
          agregadoId={agregadoId}
          onAgregar={handleAgregar}
        />
      </TableCard>

      <div className="flex shrink-0 justify-end border-t pt-4">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}
