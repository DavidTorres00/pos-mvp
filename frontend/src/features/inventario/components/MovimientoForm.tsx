import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { movimientoSchema, type MovimientoFormValues } from '@/features/inventario/schemas/movimientoSchema'
import { numeroDesdeTexto } from '@/lib/numericInput'

interface MovimientoFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: MovimientoFormValues) => void
}

export function MovimientoForm({ isPending, errorMessage, onSubmit }: MovimientoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MovimientoFormValues>({
    resolver: zodResolver(movimientoSchema),
    defaultValues: { tipo: 'entrada' },
  })
  // Fetches the largest page the backend allows (size=100) since this dropdown needs the
  // full catalog, not a paginated slice.
  const { data: productosData } = useProductos('', 1, 100)
  const productos = productosData?.items ?? []

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <SelectField
        control={control}
        name="producto_id"
        label="Producto"
        placeholder="Selecciona un producto"
        error={errors.producto_id}
        options={productos.map((producto) => ({
          value: String(producto.id),
          label: `${producto.nombre} (stock: ${producto.stock})`,
        }))}
        parse={(value) => Number(value)}
      />

      <SelectField
        control={control}
        name="tipo"
        label="Tipo"
        options={[
          { value: 'entrada', label: 'Entrada' },
          { value: 'salida', label: 'Salida' },
        ]}
      />

      <FormField
        label="Cantidad"
        type="number"
        register={register('cantidad', { setValueAs: numeroDesdeTexto })}
        error={errors.cantidad}
      />

      <FormField label="Motivo (opcional)" register={register('motivo')} error={errors.motivo} />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar movimiento'}
      </Button>
    </form>
  )
}
