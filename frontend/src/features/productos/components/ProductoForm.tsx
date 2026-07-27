import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
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
  // Fetches the largest page the backend allows (size=100) since this dropdown needs the
  // full catalog, not a paginated slice.
  const { data: categoriasData } = useCategorias('', 1, 100)
  const categorias = categoriasData?.items ?? []

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="SKU" register={register('sku')} error={errors.sku} />
      <FormField
        label="Precio de venta"
        type="number"
        step="0.01"
        register={register('precio_venta', { valueAsNumber: true })}
        error={errors.precio_venta}
      />
      <SelectField
        control={control}
        name="categoria_id"
        label="Categoría"
        placeholder="Sin categoría"
        error={errors.categoria_id}
        options={[
          { value: SIN_CATEGORIA, label: 'Sin categoría' },
          ...categorias.map((categoria) => ({ value: String(categoria.id), label: categoria.nombre })),
        ]}
        serialize={(value) => (value === null ? SIN_CATEGORIA : String(value))}
        parse={(value) => (value === SIN_CATEGORIA ? null : Number(value))}
      />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
