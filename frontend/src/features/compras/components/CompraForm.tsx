import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { compraSchema, type CompraFormValues } from '@/features/compras/schemas/compraSchema'

interface CompraFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: CompraFormValues) => void
}

function LineaTotal({ control, index }: { control: Control<CompraFormValues>; index: number }) {
  const cantidad = useWatch({ control, name: `items.${index}.cantidad` }) || 0
  const costo = useWatch({ control, name: `items.${index}.costo_unitario` }) || 0
  return <span className="text-sm tabular-nums">${(cantidad * costo).toFixed(2)}</span>
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
  const total = items?.reduce((sum, item) => sum + (item?.cantidad || 0) * (item?.costo_unitario || 0), 0) ?? 0

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="proveedor">Proveedor</Label>
        <Input id="proveedor" {...register('proveedor')} />
        {errors.proveedor && <p className="text-sm text-destructive">{errors.proveedor.message}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <Label>Productos</Label>
        {fields.map((field, index) => (
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
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={String(producto.id)}>
                          {producto.nombre}
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
            <Input
              type="number"
              step="0.01"
              placeholder="Costo"
              className="w-24"
              {...register(`items.${index}.costo_unitario`, { valueAsNumber: true })}
            />
            <LineaTotal control={control} index={index} />
            <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
              Quitar
            </Button>
          </div>
        ))}
        {errors.items?.message && <p className="text-sm text-destructive">{errors.items.message}</p>}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ producto_id: null, cantidad: 1, costo_unitario: 0 })}
        >
          Agregar producto
        </Button>
      </div>

      <p className="text-right font-semibold">Total: ${total.toFixed(2)}</p>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar compra'}
      </Button>
    </form>
  )
}
