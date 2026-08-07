import type { ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState, ErrorState, LoadingState } from '@/components/DataStates'
import { cn } from '@/lib/utils'

interface MasterListAsideProps<T> {
  title: string
  headerAction?: ReactNode
  search: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void
  searchPlaceholder: string
  searchAriaLabel: string
  isLoading: boolean
  isError: boolean
  items: T[]
  emptyMessage: string
  getId: (item: T) => number
  selectedId: number | null
  onSelect: (id: number) => void
  renderItem: (item: T) => ReactNode
  // tinte de alerta para filas que necesitan atención (p. ej. categoría con stock bajo/sin
  // stock) — opcional, el resto de los hubs (Sucursales, Proveedores) simplemente no lo pasan
  isItemAlert?: (item: T) => boolean
  // menú de acciones por fila (p. ej. `EntityActionsMenu`) — opcional, esquina derecha de la
  // fila; su click no dispara onSelect (ver stopPropagation abajo)
  renderItemActions?: (item: T) => ReactNode
}

// Lista maestra de un hub maestro-detalle (ver SucursalesPage/ProductosPage) — búsqueda + fila
// seleccionable por botón, con estado de carga/error/vacío. `renderItem` deja el contenido de
// cada fila completamente a cargo del llamador (nombre + subtítulo), este componente solo
// resuelve el esqueleto (layout, estado seleccionado, loading/error/empty) común a ambos.
export function MasterListAside<T>({
  title,
  headerAction,
  search,
  onSearchChange,
  onClearSearch,
  searchPlaceholder,
  searchAriaLabel,
  isLoading,
  isError,
  items,
  emptyMessage,
  getId,
  selectedId,
  onSelect,
  renderItem,
  isItemAlert,
  renderItemActions,
}: MasterListAsideProps<T>) {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {headerAction}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchAriaLabel}
        />
        {search !== '' && (
          <Button variant="ghost" size="sm" onClick={onClearSearch}>
            Limpiar
          </Button>
        )}
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState />
      ) : items.length === 0 ? (
        <EmptyState message={emptyMessage} bordered={false} />
      ) : (
        <nav className="flex flex-col gap-1.5">
          {items.map((item) => {
            const id = getId(item)
            return (
              // `div` con role="button", no un `<button>`: el menú de `renderItemActions` es en
              // sí un botón (con su propio DropdownMenuTrigger), y un botón dentro de otro botón
              // es HTML inválido además de romper el foco/click del menú.
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect(id)
                  }
                }}
                className={cn(
                  'flex cursor-pointer items-start justify-between gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
                  id === selectedId
                    ? 'border-primary bg-primary/5'
                    : isItemAlert?.(item)
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'hover:bg-muted',
                )}
              >
                <div className="flex flex-col gap-0.5">{renderItem(item)}</div>
                {renderItemActions && (
                  <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                    {renderItemActions(item)}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      )}
    </aside>
  )
}
