import { Navigate } from 'react-router-dom'

import { LiveClock } from '@/components/LiveClock'
import { SplitBrandScreen } from '@/components/SplitBrandScreen'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())

  if (isAuthenticated) {
    // el cajero llega a trabajar con su monto inicial ya contado — lo manda directo a
    // abrir/ver su caja en vez de al Dashboard, que es vista de admin
    return <Navigate to={usuario?.role === 'cajero' ? '/caja' : '/'} replace />
  }

  return (
    <SplitBrandScreen footer={<LiveClock />}>
      <div className="flex w-full max-w-[clamp(360px,32vw,480px)] flex-col gap-8">
        <div>
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Acceso al sistema</p>
          <h2 className="mt-1 text-[clamp(2rem,3.5vw,2.75rem)] font-bold tracking-tight">Iniciar sesión</h2>
          <p className="mt-3 text-base text-muted-foreground">Ingresa tus credenciales para continuar.</p>
        </div>
        <div className="border-t" />
        <LoginForm />
      </div>
    </SplitBrandScreen>
  )
}
