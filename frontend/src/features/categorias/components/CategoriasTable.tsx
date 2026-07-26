import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/DataStates'
import type { Categoria } from '@/services/categoriaService'

interface CategoriasTableProps {
  categorias: Categoria[]
  onEdit: (categoria: Categoria) => void
  onToggleEstado: (categoria: Categoria) => void
}

export function CategoriasTable({ categorias, onEdit, onToggleEstado }: CategoriasTableProps) {
  if (categorias.length === 0) {
    return <EmptyState message="No hay categorías." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {categorias.map((categoria) => (
          <TableRow key={categoria.id}>
            <TableCell>{categoria.nombre}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={categoria.activo}
                  onCheckedChange={() => onToggleEstado(categoria)}
                  aria-label={categoria.activo ? `Desactivar ${categoria.nombre}` : `Activar ${categoria.nombre}`}
                />
                <span className={categoria.activo ? 'text-sm text-foreground' : 'text-sm text-muted-foreground'}>
                  {categoria.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Button variant="outline" size="sm" onClick={() => onEdit(categoria)}>
                Editar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
