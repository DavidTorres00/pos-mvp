import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import { productoSchema, type ProductoFormValues } from '@/features/productos/schemas/productoSchema'

const SIN_CATEGORIA = 'sin-categoria'

interface ProductoFormProps {
  defaultValues?: ProductoFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: ProductoFormValues) => void
}

export function ProductoForm({ defaultValues, isPending, errorMessage, onSubmit }: ProductoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues: defaultValues ?? { categoria_id: null },
  })
  const { data: categorias = [] } = useCategorias('')

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...register('nombre')} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" {...register('sku')} />
        {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="precio_venta">Precio de venta</Label>
        <Input id="precio_venta" type="number" step="0.01" {...register('precio_venta', { valueAsNumber: true })} />
        {errors.precio_venta && <p className="text-sm text-destructive">{errors.precio_venta.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Categoría</Label>
        <Controller
          name="categoria_id"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value === null ? SIN_CATEGORIA : String(field.value)}
              onValueChange={(value) => field.onChange(value === SIN_CATEGORIA ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SIN_CATEGORIA}>Sin categoría</SelectItem>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria.id} value={String(categoria.id)}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
