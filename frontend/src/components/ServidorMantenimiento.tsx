import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, RefreshCwIcon, XCircleIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LiveClock } from '@/components/LiveClock'
import { SplitBrandScreen } from '@/components/SplitBrandScreen'
import { formatTime } from '@/lib/format'
import { useNavigatorOnline } from '@/lib/hooks/useNavigatorOnline'
import { useServidorStore } from '@/stores/servidorStore'

// lo que hoy depende de una request al servidor y por lo tanto no puede completarse mientras
// esté caído — ninguna se pierde, solo queda pendiente hasta reconectar (ver decisión de NO
// construir cola/persistencia local: complejidad + riesgo de reconciliar dinero después no se
// justifica para 2 sucursales)
const CAPACIDADES_SIN_CONEXION = [
  {
    label: 'Cobrar (efectivo, tarjeta o transferencia)',
    motivo: 'cada venta se registra directo en el servidor; no hay una copia local que guardarla',
  },
  {
    label: 'Cerrar turno o retirar excedente',
    motivo: 'el cierre de caja se calcula y se registra en el servidor',
  },
  { label: 'Consultar catálogo o precios actualizados', motivo: 'se necesita conexión para traer el catálogo vigente' },
]

// gatea TODO ProtectedLayout (ver layouts/ProtectedLayout.tsx) mientras el servidor no
// responde — reemplaza los toasts/ErrorState dispersos por una sola pantalla, para cajero y
// admin por igual. La recuperación es activa vía el heartbeat de `useSaludServidor` (siempre
// montado en ProtectedLayout, no aquí — así sigue sondeando aunque este componente ni siquiera
// esté montado todavía por un instante entre renders). Este componente solo observa esa misma
// query (`useIsFetching`) para el spinner del botón y puede forzar un refetch inmediato.
// Tipografía/alineación: mismo lenguaje "eyebrow + título font-black, alineado a la izquierda"
// que ya usa la pantalla de excedente en VentaKiosco ("Cobro detenido") — no una pantalla más
// centrada tipo formulario. Ancho y espaciados en `clamp()` (mismo idioma fluido que
// `AbrirCajaSplash`/`SplitBrandScreen`, no un breakpoint fijo) para que la pantalla respire en
// monitores grandes sin quedar apretada en uno chico.
export function ServidorMantenimiento() {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching({ queryKey: ['salud-servidor'] }) > 0
  const ultimoError = useServidorStore((state) => state.ultimoError)
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  // el navegador no distingue "sin red" de "servidor caído" a nivel de fetch/XHR (mismo error
  // sin `response` en ambos casos) — `navigator.onLine` sí lo distingue de forma confiable
  // cuando la interfaz de red del equipo está completamente desconectada (ver
  // lib/hooks/useNavigatorOnline.ts). El bloqueo es idéntico en los dos casos, solo cambia el texto.
  const online = useNavigatorOnline()

  return (
    <SplitBrandScreen footer={<LiveClock />} align="start">
      <div className="flex w-full max-w-[clamp(28rem,60vw,56rem)] flex-col gap-[clamp(1.5rem,3vw,3rem)]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex w-fit items-center rounded-sm bg-destructive px-2.5 py-1 text-xs font-bold tracking-widest text-destructive-foreground uppercase">
              Sin conexión
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-destructive uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-destructive" />
              Reintentando automáticamente
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] font-black tracking-tight">
            {online ? 'Servidor en mantenimiento' : 'Sin conexión a internet'}
          </h1>
          <p className="max-w-xl text-[clamp(1rem,1.3vw,1.25rem)] text-muted-foreground">
            {online
              ? 'No podemos conectar con el servidor. La terminal se reconectará sola cuando termine; no reinicies el equipo.'
              : 'Este equipo no tiene conexión de red. Revisa el cable o el Wi-Fi; la terminal se reconectará sola en cuanto vuelva.'}
          </p>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Mientras no haya conexión
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPACIDADES_SIN_CONEXION.map((capacidad) => (
              <div key={capacidad.label} className="flex items-start gap-3">
                <XCircleIcon className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div className="flex flex-col gap-0.5">
                  <p className="text-base font-semibold">{capacidad.label}</p>
                  <p className="text-sm text-muted-foreground">{capacidad.motivo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button
            size="lg"
            onClick={() => queryClient.refetchQueries({ queryKey: ['salud-servidor'] })}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCwIcon className={isFetching ? 'size-4 animate-spin' : 'size-4'} />
            {isFetching ? 'Reintentando...' : 'Reintentar ahora'}
          </Button>

          {ultimoError && (
            <button
              type="button"
              onClick={() => setDetalleAbierto((abierto) => !abierto)}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Ver detalle técnico
              {detalleAbierto ? <ChevronUpIcon className="size-4" /> : <ChevronDownIcon className="size-4" />}
            </button>
          )}
        </div>

        {ultimoError && detalleAbierto && (
          <p className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
            {ultimoError.mensaje}
            {ultimoError.codigo && ` (${ultimoError.codigo})`} · último intento {formatTime(ultimoError.hora)}
          </p>
        )}
      </div>
    </SplitBrandScreen>
  )
}
