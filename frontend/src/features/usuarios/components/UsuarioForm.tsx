import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { usuarioCreateSchema, type UsuarioCreateFormValues } from '@/features/usuarios/schemas/usuarioSchema'

interface UsuarioFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: UsuarioCreateFormValues) => void
}

export function UsuarioForm({ isPending, errorMessage, onSubmit }: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsuarioCreateFormValues>({ resolver: zodResolver(usuarioCreateSchema) })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="Email" type="email" register={register('email')} error={errors.email} />
      <FormField label="Contraseña" type="password" register={register('password')} error={errors.password} />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear cajero'}
      </Button>
    </form>
  )
}
