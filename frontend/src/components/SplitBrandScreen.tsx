import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface SplitBrandScreenProps {
  footer?: ReactNode
  children: ReactNode
  // 'center' (default, Login/AbrirCaja): contenido centrado en el panel derecho, con su propio
  // padding más generoso. 'start': el borde superior del contenido queda a la misma altura que
  // "MVP POS" del panel de marca (mismo padding-top exacto que el <aside>) — para pantallas con
  // más contenido (listas, badges) que una pantalla centrada tipo formulario.
  align?: 'center' | 'start'
}

// Layout de pantalla completa (sin sidebar de la app) para los momentos en los que el usuario
// está fuera del flujo normal: login, apertura de caja, servidor caído/restablecido. El panel
// izquierdo es puramente de marca — siempre el mismo, sin importar la pantalla ni el usuario —
// con tamaños fluidos (clamp) para aprovechar monitores grandes en vez de quedar topado a un
// ancho fijo. Lo que cambia por pantalla vive del lado derecho, vía `children`. Franja azul
// (`bg-primary`, mismo tono que el botón principal) de 4px arriba de toda la pantalla — elemento
// fijo del diseño, no condicionada a ningún estado.
export function SplitBrandScreen({ footer, children, align = 'center' }: SplitBrandScreenProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <div className="h-1 w-full shrink-0 bg-primary" />
      <div className="flex flex-1 flex-col sm:flex-row">
        <aside className="hidden w-[clamp(320px,28vw,480px)] shrink-0 flex-col justify-between bg-primary p-[clamp(2.5rem,4vw,4rem)] text-primary-foreground sm:flex">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <div className="font-heading text-lg font-bold tracking-tight">MVP POS</div>
              <div className="border-t border-primary-foreground/25" />
            </div>
            <h1 className="text-[clamp(2.5rem,4.5vw,4.5rem)] font-bold tracking-tight">
              Punto
              <br />
              de venta
            </h1>
          </div>
          {footer && <div className="flex flex-col gap-1 text-sm text-primary-foreground/70">{footer}</div>}
        </aside>

        <div className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground sm:hidden">
          <span className="font-heading text-sm font-semibold tracking-tight">MVP POS</span>
        </div>

        <div
          className={cn(
            'flex flex-1 justify-center',
            align === 'start' ? 'items-start p-[clamp(2.5rem,4vw,4rem)]' : 'items-center p-[clamp(2rem,5vw,6rem)]',
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
