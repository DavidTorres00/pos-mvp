import { Navigate } from 'react-router-dom'

import { LiveClock } from '@/components/LiveClock'
import { SplitBrandScreen } from '@/components/SplitBrandScreen'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const usuario = useAuthStore((state) => state.usuario)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated())

  if (isAuthenticated) {
    // cajero y admin caen ambos en Ventas (el cajero exige caja abierta antes de dejarlo
    // pasar, ver ProtectedLayout; para el admin es la pantalla de entrada, ya no hay Dashboard
    // separado); el superuser tiene una única pantalla propia
    const destino = usuario?.role === 'superuser' ? '/plan' : '/ventas'
    return <Navigate to={destino} replace />
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
