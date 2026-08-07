import type { ReactNode } from 'react'

import { EntityHeaderCard } from '@/components/EntityHeaderCard'
import type { Categoria } from '@/services/categoriaService'

interface CategoriaHeaderCardProps {
  categoria: Categoria
  sucursalSelector?: ReactNode
}

// Sin menú de acciones propio: Editar/Subcategorías/Activar-Desactivar ya viven en el menú "⋮"
// de la fila de esta categoría en MasterListAside (ver ProductosPage) — repetirlo aquí sería
// una segunda entrada para la misma acción sin ganar nada, solo quitándole espacio al selector
// de sucursal, que es lo único que de verdad pertenece a este header.
export function CategoriaHeaderCard({ categoria, sucursalSelector }: CategoriaHeaderCardProps) {
  return (
    <EntityHeaderCard
      nombre={categoria.nombre}
      activo={categoria.activo}
      infoLines={<p className="text-sm text-muted-foreground">Código {categoria.codigo}</p>}
      sideContent={sucursalSelector}
    />
  )
}
