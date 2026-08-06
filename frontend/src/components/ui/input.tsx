import * as React from "react"

import { sanitizarNumeroNoNegativo } from "@/lib/numericInput"
import { cn } from "@/lib/utils"

function Input({ className, type, autoComplete, inputMode, onChange, ...props }: React.ComponentProps<"input">) {
  const esMontoOCantidad = type === "number"

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (esMontoOCantidad) {
      const limpio = sanitizarNumeroNoNegativo(e.target.value)
      if (limpio !== e.target.value) e.target.value = limpio
    }
    onChange?.(e)
  }

  return (
    <input
      // `type="number"` en el caller se renderiza como texto real: el nativo tiene un hueco de
      // spec donde el navegador puede mostrar texto inválido en pantalla mientras el `value`
      // que JS lee ya colapsó a "" — el saneo de abajo nunca alcanzaría a ver ni limpiar eso
      // (ver lib/numericInput.ts). Con texto + regex propio, lo que se ve y lo que se valida
      // son siempre el mismo string.
      type={esMontoOCantidad ? "text" : type}
      inputMode={esMontoOCantidad ? (inputMode ?? "decimal") : inputMode}
      data-slot="input"
      // ningún campo de monto/cantidad necesita autocompletado del navegador
      autoComplete={esMontoOCantidad ? (autoComplete ?? "off") : autoComplete}
      onChange={handleChange}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
