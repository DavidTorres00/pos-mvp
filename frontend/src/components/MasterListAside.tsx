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
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={cn(
                  'flex flex-col gap-0.5 rounded-lg border p-3 text-left text-sm transition-colors',
                  id === selectedId ? 'border-primary bg-primary/5' : 'hover:bg-muted',
                )}
              >
                {renderItem(item)}
              </button>
            )
          })}
        </nav>
      )}
    </aside>
  )
}
