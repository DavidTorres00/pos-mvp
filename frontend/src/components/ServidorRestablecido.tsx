import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { LiveClock } from '@/components/LiveClock'
import { SplitBrandScreen } from '@/components/SplitBrandScreen'
import { formatTime } from '@/lib/format'

interface ServidorRestablecidoProps {
  onContinuar: () => void
}

const SEGUNDOS_AUTO_CONTINUAR = 4

// paso intermedio entre `ServidorMantenimiento` y volver al kiosko/panel — sin esto, en cuanto
// el heartbeat detecta que el servidor respondió, ProtectedLayout saltaría directo de vuelta a
// la pantalla anterior sin que el usuario se entere de que ya puede seguir. A diferencia de
// CierreResumen/excedente (que exigen clic porque hay dinero de por medio que confirmar), aquí
// no hay nada que revisar — se cierra sola tras `SEGUNDOS_AUTO_CONTINUAR`, con "Continuar ahora"
// disponible para quien no quiera esperar. Mismo lenguaje tipográfico (eyebrow + título
// font-black, izquierda) que `ServidorMantenimiento`, en verde en vez de rojo.
export function ServidorRestablecido({ onContinuar }: ServidorRestablecidoProps) {
  const [reconectadoEn] = useState(() => new Date())
  const [segundosRestantes, setSegundosRestantes] = useState(SEGUNDOS_AUTO_CONTINUAR)
  // `onContinuar` es una función nueva en cada render de ProtectedLayout — si estuviera en las
  // dependencias del efecto, cualquier re-render del layout (heartbeat, polling de caja, etc.)
  // reiniciaría la cuenta atrás sin avanzarla. La ref la mantiene disponible sin volver a
  // disparar el efecto (mismo patrón que agregarProductoRef en VentaKiosco/ProtectedLayout).
  const onContinuarRef = useRef(onContinuar)
  onContinuarRef.current = onContinuar

  useEffect(() => {
    if (segundosRestantes <= 0) {
      onContinuarRef.current()
      return
    }
    const id = window.setTimeout(() => setSegundosRestantes((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [segundosRestantes])

  return (
    <SplitBrandScreen footer={<LiveClock />} align="start">
      <div className="flex w-full max-w-[clamp(28rem,60vw,56rem)] flex-col gap-[clamp(1.5rem,3vw,3rem)]">
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center rounded-sm bg-success px-2.5 py-1 text-xs font-bold tracking-widest text-success-foreground uppercase">
            Conexión restablecida
          </span>
          <h1 className="text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] font-black tracking-tight">
            Ya puedes continuar
          </h1>
          <p className="max-w-xl text-[clamp(1rem,1.3vw,1.25rem)] text-muted-foreground">
            El servidor ya responde. Puedes seguir donde lo dejaste.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" onClick={onContinuar}>
              Continuar ahora
            </Button>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-success uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Continuando automáticamente en {segundosRestantes}s
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Reconectado a las {formatTime(reconectadoEn)}</p>
        </div>
      </div>
    </SplitBrandScreen>
  )
}
