import { z } from 'zod'

export const aperturaSchema = z.object({
  monto_inicial: z.number().nonnegative('El monto no puede ser negativo'),
})
export type AperturaFormValues = z.infer<typeof aperturaSchema>

export const cierreSchema = z.object({
  monto_final: z.number().nonnegative('El monto no puede ser negativo'),
})
export type CierreFormValues = z.infer<typeof cierreSchema>

export const movimientoCajaSchema = z.object({
  tipo: z.enum(['entrada', 'salida']),
  monto: z.number().positive('El monto debe ser mayor a 0'),
  motivo: z.string().optional(),
})
export type MovimientoCajaFormValues = z.infer<typeof movimientoCajaSchema>
