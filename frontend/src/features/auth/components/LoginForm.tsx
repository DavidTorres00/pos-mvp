import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { useLogin } from '@/features/auth/hooks/useLogin'
import { loginSchema, type LoginFormValues } from '@/features/auth/schemas/loginSchema'

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })
  const loginMutation = useLogin()

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit((values) => loginMutation.mutate(values))}>
      <FormField
        label="Email"
        type="email"
        autoComplete="username"
        register={register('email')}
        error={errors.email}
      />

      <FormField
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        register={register('password')}
        error={errors.password}
      />

      {loginMutation.isError && (
        <p role="alert" className="text-sm text-destructive">
          Email o contraseña incorrectos
        </p>
      )}

      <Button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  )
}
