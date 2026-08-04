import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { subcategoriaSchema, type SubcategoriaFormValues } from '@/features/subcategorias/schemas/subcategoriaSchema'

interface SubcategoriaFormProps {
  defaultValues?: SubcategoriaFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: SubcategoriaFormValues) => void
}

export function SubcategoriaForm({ defaultValues, isPending, errorMessage, onSubmit }: SubcategoriaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubcategoriaFormValues>({
    resolver: zodResolver(subcategoriaSchema),
    defaultValues,
  })

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
