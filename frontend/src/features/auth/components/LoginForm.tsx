import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((values) => loginMutation.mutate(values))}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      {loginMutation.isError && (
        <p className="text-sm text-destructive">Email o contraseña incorrectos</p>
      )}

      <Button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  )
}
