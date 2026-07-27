import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/form/SelectField'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { ventaSchema, type VentaFormValues } from '@/features/ventas/schemas/ventaSchema'
import { formatCurrency } from '@/lib/format'
import { sumLineTotals } from '@/lib/lineItems'
import type { Producto } from '@/services/productoService'

interface VentaFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: VentaFormValues) => void
}

export function VentaForm({ isPending, errorMessage, onSubmit }: VentaFormProps) {
  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<VentaFormValues>({
    resolver: zodResolver(ventaSchema),
    defaultValues: { items: [{ producto_id: null, cantidad: 1 }] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  // Fetches the largest page the backend allows (size=100) since this dropdown needs the
  // full catalog, not a paginated slice.
  const { data: productosData } = useProductos('', 1, 100)
  const productos = productosData?.items ?? []
  const items = useWatch({ control, name: 'items' })

  const productoPorId = (id: number | null): Producto | undefined => productos.find((p) => p.id === id)
  const lineTotal = (item?: { producto_id: number | null; cantidad: number }) => {
    const producto = productoPorId(item?.producto_id ?? null)
    return producto ? Number(producto.precio_venta) * (item?.cantidad || 0) : 0
  }
  const total = sumLineTotals(items, lineTotal)

  const productoOptions = productos.map((producto) => ({
    value: String(producto.id),
    label: `${producto.nombre} (stock: ${producto.stock})`,
  }))

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-3">
        <span className="text-sm leading-none font-medium">Productos</span>
        {fields.map((field, index) => {
          const subtotal = formatCurrency(lineTotal(items?.[index]))
          return (
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
              <span className="w-24 text-sm tabular-nums" aria-label={`Subtotal: ${subtotal}`}>
                {subtotal}
              </span>
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
          )
        })}
        {errors.items?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.items.message}
          </p>
        )}

        <Button type="button" variant="outline" size="sm" onClick={() => append({ producto_id: null, cantidad: 1 })}>
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
        {isPending ? 'Guardando...' : 'Registrar venta'}
      </Button>
    </form>
  )
}
