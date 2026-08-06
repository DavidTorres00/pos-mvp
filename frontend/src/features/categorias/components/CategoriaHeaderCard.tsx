import { Button } from '@/components/ui/button'
import { EntityHeaderCard } from '@/components/EntityHeaderCard'
import type { Categoria } from '@/services/categoriaService'

interface CategoriaHeaderCardProps {
  categoria: Categoria
  onEdit: () => void
  onToggleEstado: () => void
  onManageSubcategorias: () => void
}

export function CategoriaHeaderCard({
  categoria,
  onEdit,
  onToggleEstado,
  onManageSubcategorias,
}: CategoriaHeaderCardProps) {
  return (
    <EntityHeaderCard
      nombre={categoria.nombre}
      activo={categoria.activo}
      infoLines={<p className="text-sm text-muted-foreground">Código {categoria.codigo}</p>}
      extraActions={
        <Button variant="outline" size="sm" onClick={onManageSubcategorias}>
          Subcategorías
        </Button>
      }
      onEdit={onEdit}
      onToggleEstado={onToggleEstado}
      toggleDialogTitle={categoria.activo ? `¿Desactivar ${categoria.nombre}?` : `¿Activar ${categoria.nombre}?`}
      toggleDialogDescription={
        categoria.activo
          ? 'Sus productos y subcategorías seguirán existiendo, pero deja de estar disponible para clasificar productos nuevos.'
          : 'Volverá a estar disponible para clasificar productos y subcategorías.'
      }
    />
  )
}
