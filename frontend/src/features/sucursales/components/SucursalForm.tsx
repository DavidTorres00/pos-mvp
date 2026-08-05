import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { sucursalSchema, type SucursalFormValues } from '@/features/sucursales/schemas/sucursalSchema'

interface SucursalFormProps {
  defaultValues?: SucursalFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: SucursalFormValues) => void
}

export function SucursalForm({ defaultValues, isPending, errorMessage, onSubmit }: SucursalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SucursalFormValues>({ resolver: zodResolver(sucursalSchema), defaultValues })

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
