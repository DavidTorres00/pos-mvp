import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Categoria } from '@/services/categoriaService'

interface CategoriasTableProps {
  categorias: Categoria[]
  onEdit: (categoria: Categoria) => void
  onToggleEstado: (categoria: Categoria) => void
}

export function CategoriasTable({ categorias, onEdit, onToggleEstado }: CategoriasTableProps) {
  if (categorias.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay categorías.</p>
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
                <Switch checked={categoria.activo} onCheckedChange={() => onToggleEstado(categoria)} />
                <Badge variant={categoria.activo ? 'default' : 'secondary'}>
                  {categoria.activo ? 'Activo' : 'Inactivo'}
                </Badge>
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
