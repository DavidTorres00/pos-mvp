// Todo campo de "monto/cantidad" de esta app (dinero o cantidades de producto) se renderiza
// como `type="text"` + `inputMode="decimal"`, nunca `type="number"` nativo — ese tipo tiene un
// hueco de spec real: cuando el texto tecleado no forma un número válido, el navegador puede
// seguir mostrando el texto inválido en pantalla mientras el `value` que JS puede leer ya
// colapsó a `""`. El saneo en `onChange` nunca alcanza a ver ni limpiar ese texto porque
// simplemente no está en el valor que React recibe — se probó bloquear por tecla, por pegado,
// reforzar en `onBlur`, y ninguno cierra ese hueco porque no es un problema de "qué evento
// escuchar", es el propio `type="number"` divergiendo entre lo que se ve y lo que se puede leer.
// Con texto real, lo que se ve y lo que lee este código son siempre el mismo string.
export function sanitizarNumeroNoNegativo(valor: string): string {
  let limpio = valor.replace(/[^0-9.]/g, '')
  const primerPunto = limpio.indexOf('.')
  if (primerPunto !== -1) {
    limpio = limpio.slice(0, primerPunto + 1) + limpio.slice(primerPunto + 1).replaceAll('.', '')
  }
  return limpio
}

// Reemplaza `valueAsNumber: true` de react-hook-form (que depende de `HTMLInputElement.valueAsNumber`,
// solo definido para `type="number"` real) ahora que el input subyacente es texto. `NaN` para
// vacío, no `undefined`: mismo comportamiento que ya tenían estos campos con `valueAsNumber`
// (zod ya sabe convertir ese caso en "número inválido"/"campo requerido" según el schema).
export function numeroDesdeTexto(valor: string): number {
  return valor === '' ? NaN : Number(valor)
}

// mismo saneo, para campos genuinamente opcionales (ej. `Producto.costo`) — vacío es un valor
// válido ("no cargado todavía"), no un error de validación como en `numeroDesdeTexto`
export function numeroOpcionalDesdeTexto(valor: string): number | null {
  return valor === '' ? null : Number(valor)
}
