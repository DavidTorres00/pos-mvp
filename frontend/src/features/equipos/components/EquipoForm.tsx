import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { equipoSchema, type EquipoFormValues } from '@/features/equipos/schemas/equipoSchema'

interface EquipoFormProps {
  defaultValues?: EquipoFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: EquipoFormValues) => void
}

export function EquipoForm({ defaultValues, isPending, errorMessage, onSubmit }: EquipoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EquipoFormValues>({ resolver: zodResolver(equipoSchema), defaultValues })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />

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
