import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { usuarioNombreSchema, type UsuarioNombreFormValues } from '@/features/usuarios/schemas/usuarioSchema'

interface UsuarioNombreFormProps {
  defaultValues: UsuarioNombreFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: UsuarioNombreFormValues) => void
}

export function UsuarioNombreForm({ defaultValues, isPending, errorMessage, onSubmit }: UsuarioNombreFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsuarioNombreFormValues>({ resolver: zodResolver(usuarioNombreSchema), defaultValues })

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
