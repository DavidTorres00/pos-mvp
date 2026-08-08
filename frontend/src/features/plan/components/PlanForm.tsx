import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { planSchema, type PlanFormValues } from '@/features/plan/schemas/planSchema'

interface PlanFormProps {
  defaultValues?: PlanFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: PlanFormValues) => void
}

export function PlanForm({ defaultValues, isPending, errorMessage, onSubmit }: PlanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlanFormValues>({ resolver: zodResolver(planSchema), defaultValues })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Límite de equipos habilitados"
        type="number"
        placeholder="Sin límite"
        register={register('limite_equipos')}
        error={errors.limite_equipos}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Cada equipo es un kit físico (impresora, lector, terminal) que este cliente contrató. El admin no puede
        agregar más equipos de los que caben en este cupo — ajústalo cuando compre uno nuevo.
      </p>

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
