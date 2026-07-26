import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { compraSchema, type CompraFormValues } from '@/features/compras/schemas/compraSchema'
import { formatCurrency } from '@/lib/format'
import { sumLineTotals } from '@/lib/lineItems'

interface CompraFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: CompraFormValues) => void
}

function LineaTotal({ control, index }: { control: Control<CompraFormValues>; index: number }) {
  const cantidad = useWatch({ control, name: `items.${index}.cantidad` }) || 0
  const costo = useWatch({ control, name: `items.${index}.costo_unitario` }) || 0
  const subtotal = formatCurrency(cantidad * costo)
  return (
    <span className="w-24 text-sm tabular-nums" aria-label={`Subtotal: ${subtotal}`}>
      {subtotal}
    </span>
  )
}

export function CompraForm({ isPending, errorMessage, onSubmit }: CompraFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: { proveedor: '', items: [{ producto_id: null, cantidad: 1, costo_unitario: 0 }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const { data: productos = [] } = useProductos('')
  const items = useWatch({ control, name: 'items' })
  const total = sumLineTotals(items, (item) => (item?.cantidad || 0) * (item?.costo_unitario || 0))

  const productoOptions = productos.map((producto) => ({ value: String(producto.id), label: producto.nombre }))

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Proveedor" register={register('proveedor')} error={errors.proveedor} />

      <div className="flex flex-col gap-3">
        <span className="text-sm leading-none font-medium">Productos</span>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex-1">
              <SelectField
                control={control}
                name={`items.${index}.producto_id`}
                label={`Producto ${index + 1}`}
                hideLabel
                placeholder="Producto"
                options={productoOptions}
                error={errors.items?.[index]?.producto_id}
                parse={(value) => Number(value)}
              />
            </div>
            <Input
              type="number"
              step="1"
              placeholder="Cant."
              className="w-20"
              aria-label={`Cantidad producto ${index + 1}`}
              {...register(`items.${index}.cantidad`, { valueAsNumber: true })}
            />
            <Input
              type="number"
              step="0.01"
              placeholder="Costo"
              className="w-24"
              aria-label={`Costo unitario producto ${index + 1}`}
              {...register(`items.${index}.costo_unitario`, { valueAsNumber: true })}
            />
            <LineaTotal control={control} index={index} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Quitar producto ${index + 1}`}
              onClick={() => remove(index)}
            >
              Quitar
            </Button>
          </div>
        ))}
        {errors.items?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.items.message}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ producto_id: null, cantidad: 1, costo_unitario: 0 })}
        >
          Agregar producto
        </Button>
      </div>

      <p className="text-right font-semibold">Total: {formatCurrency(total)}</p>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar compra'}
      </Button>
    </form>
  )
}
