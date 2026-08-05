import { useEffect, useState } from 'react'

import { formatWeekdayDate } from '@/lib/format'

// Reloj/fecha en vivo (hora del navegador, sin lógica de negocio) para las pantallas
// de marca de pantalla completa (login, apertura de caja).
export function LiveClock() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-[clamp(1.75rem,3vw,3rem)] font-bold tabular-nums text-primary-foreground">
        {ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
      </p>
      <p className="max-w-32 text-right text-xs font-medium tracking-wide text-primary-foreground/70 uppercase">
        {formatWeekdayDate(ahora)}
      </p>
    </div>
  )
}
