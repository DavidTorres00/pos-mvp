import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
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
      <SelectField
        control={control}
        name="tipo"
        label="Tipo"
        options={[
          { value: 'entrada', label: 'Entrada (depósito)' },
          { value: 'salida', label: 'Salida (retiro)' },
        ]}
      />

      <FormField
        label="Monto"
        type="number"
        step="0.01"
        register={register('monto', { valueAsNumber: true })}
        error={errors.monto}
      />

      <FormField label="Motivo (opcional)" register={register('motivo')} error={errors.motivo} />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Registrar'}
      </Button>
    </form>
  )
}
