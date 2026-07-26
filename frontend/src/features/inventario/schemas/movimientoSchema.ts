import { z } from 'zod'

export const movimientoSchema = z.object({
  producto_id: z.number({ message: 'Selecciona un producto' }),
  tipo: z.enum(['entrada', 'salida']),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().optional(),
})

export type MovimientoFormValues = z.infer<typeof movimientoSchema>
