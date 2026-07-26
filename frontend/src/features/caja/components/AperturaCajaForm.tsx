import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { aperturaSchema, type AperturaFormValues } from '@/features/caja/schemas/cajaSchema'

interface AperturaCajaFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: AperturaFormValues) => void
}

export function AperturaCajaForm({ isPending, errorMessage, onSubmit }: AperturaCajaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AperturaFormValues>({ resolver: zodResolver(aperturaSchema) })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Monto inicial"
        type="number"
        step="0.01"
        register={register('monto_inicial', { valueAsNumber: true })}
        error={errors.monto_inicial}
      />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Abriendo...' : 'Abrir caja'}
      </Button>
    </form>
  )
}
