import { z } from 'zod'

export const aperturaSchema = z
  .object({
    // nullable (no un simple z.number()) para distinguir "no elegido todavía" de un valor
    // inválido — mismo patrón que proveedor_id/sucursal_id, mensaje propio vía superRefine
    equipo_id: z.number().nullable(),
    // `error` cubre el caso de enviar el campo vacío (NaN/undefined, ver numeroDesdeTexto) con
    // un mensaje que dice qué hacer, no el genérico de zod ("se esperaba número, recibido NaN")
    monto_inicial: z.number({ error: 'Ingresa un monto inicial' }).nonnegative('El monto no puede ser negativo'),
  })
  .superRefine((values, ctx) => {
    if (values.equipo_id === null) {
      ctx.addIssue({ code: 'custom', message: 'Selecciona un equipo', path: ['equipo_id'] })
    }
  })
export type AperturaFormValues = z.infer<typeof aperturaSchema>

export const cierreSchema = z.object({
  monto_final: z.number({ error: 'Ingresa el monto final contado' }).nonnegative('El monto no puede ser negativo'),
  // requerido solo si el cierre resulta en faltante — ese chequeo depende de `monto_esperado`
  // (prop, no dato del form), así que se valida a mano en CierreCajaForm, no aquí
  motivo_diferencia: z.string().optional(),
})
export type CierreFormValues = z.infer<typeof cierreSchema>
