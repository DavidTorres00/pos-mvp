import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { ventaSchema, type VentaFormValues } from '@/features/ventas/schemas/ventaSchema'
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
  const { data: productos = [] } = useProductos('')
  const items = useWatch({ control, name: 'items' })

  const productoPorId = (id: number | null): Producto | undefined => productos.find((p) => p.id === id)
  const total =
    items?.reduce((sum, item) => {
      const producto = productoPorId(item?.producto_id ?? null)
      return sum + (producto ? Number(producto.precio_venta) * (item?.cantidad || 0) : 0)
    }, 0) ?? 0

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-3">
        <Label>Productos</Label>
        {fields.map((field, index) => {
          const producto = productoPorId(items?.[index]?.producto_id ?? null)
          const cantidad = items?.[index]?.cantidad || 0
          const subtotal = producto ? Number(producto.precio_venta) * cantidad : 0
          return (
            <div key={field.id} className="flex items-end gap-2">
              <div className="flex-1">
                <Controller
                  name={`items.${index}.producto_id`}
                  control={control}
                  render={({ field: selectField }) => (
                    <Select
                      value={selectField.value ? String(selectField.value) : ''}
                      onValueChange={(value) => selectField.onChange(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Producto" />
                      </SelectTrigger>
                      <SelectContent>
                        {productos.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.nombre} (stock: {p.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.items?.[index]?.producto_id && (
                  <p className="text-sm text-destructive">{errors.items[index]?.producto_id?.message}</p>
                )}
              </div>
              <Input
                type="number"
                step="1"
                placeholder="Cant."
                className="w-20"
                {...register(`items.${index}.cantidad`, { valueAsNumber: true })}
              />
              <span className="w-24 text-sm tabular-nums">${subtotal.toFixed(2)}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
                Quitar
              </Button>
            </div>
          )
        })}
        {errors.items?.message && <p className="text-sm text-destructive">{errors.items.message}</p>}

        <Button type="button" variant="outline" size="sm" onClick={() => append({ producto_id: null, cantidad: 1 })}>
          Agregar producto
        </Button>
      </div>

      <p className="text-right font-semibold">Total: ${total.toFixed(2)}</p>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar venta'}
      </Button>
    </form>
  )
}
