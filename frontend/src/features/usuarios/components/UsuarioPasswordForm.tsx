import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { usuarioPasswordSchema, type UsuarioPasswordFormValues } from '@/features/usuarios/schemas/usuarioSchema'

interface UsuarioPasswordFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: UsuarioPasswordFormValues) => void
}

export function UsuarioPasswordForm({ isPending, errorMessage, onSubmit }: UsuarioPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UsuarioPasswordFormValues>({ resolver: zodResolver(usuarioPasswordSchema), defaultValues: { password: '' } })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Contraseña nueva"
        type="password"
        placeholder="Mínimo 8 caracteres"
        register={register('password')}
        error={errors.password}
      />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Restablecer contraseña'}
      </Button>
    </form>
  )
}
