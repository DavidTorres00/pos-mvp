import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { movimientoSchema, type MovimientoFormValues } from '@/features/inventario/schemas/movimientoSchema'

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
  const { data: productos = [] } = useProductos('')

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label>Producto</Label>
        <Controller
          name="producto_id"
          control={control}
          render={({ field }) => (
            <Select value={field.value ? String(field.value) : ''} onValueChange={(value) => field.onChange(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((producto) => (
                  <SelectItem key={producto.id} value={String(producto.id)}>
                    {producto.nombre} (stock: {producto.stock})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.producto_id && <p className="text-sm text-destructive">{errors.producto_id.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Tipo</Label>
        <Controller
          name="tipo"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="cantidad">Cantidad</Label>
        <Input id="cantidad" type="number" step="1" {...register('cantidad', { valueAsNumber: true })} />
        {errors.cantidad && <p className="text-sm text-destructive">{errors.cantidad.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="motivo">Motivo (opcional)</Label>
        <Input id="motivo" {...register('motivo')} />
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar movimiento'}
      </Button>
    </form>
  )
}
