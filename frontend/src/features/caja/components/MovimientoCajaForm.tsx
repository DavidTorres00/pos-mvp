import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { movimientoCajaSchema, type MovimientoCajaFormValues } from '@/features/caja/schemas/cajaSchema'

interface MovimientoCajaFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: MovimientoCajaFormValues) => void
}

export function MovimientoCajaForm({ isPending, errorMessage, onSubmit }: MovimientoCajaFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<MovimientoCajaFormValues>({
    resolver: zodResolver(movimientoCajaSchema),
    defaultValues: { tipo: 'entrada' },
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
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
                <SelectItem value="entrada">Entrada (depósito)</SelectItem>
                <SelectItem value="salida">Salida (retiro)</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="monto">Monto</Label>
        <Input id="monto" type="number" step="0.01" {...register('monto', { valueAsNumber: true })} />
        {errors.monto && <p className="text-sm text-destructive">{errors.monto.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="motivo">Motivo (opcional)</Label>
        <Input id="motivo" {...register('motivo')} />
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar'}
      </Button>
    </form>
  )
}
