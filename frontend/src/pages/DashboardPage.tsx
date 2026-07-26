import { useAuthStore } from '@/stores/authStore'

export function DashboardPage() {
  const usuario = useAuthStore((state) => state.usuario)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <p className="text-lg">Bienvenido, {usuario?.nombre}</p>
    </div>
  )
}
