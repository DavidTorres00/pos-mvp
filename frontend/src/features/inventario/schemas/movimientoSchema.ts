import { z } from 'zod'

export const movimientoSchema = z.object({
  producto_id: z.number({ error: 'Selecciona un producto' }),
  tipo: z.enum(['entrada', 'salida']),
  cantidad: z.number({ error: 'Ingresa la cantidad' }).int('La cantidad debe ser un número entero').positive('La cantidad debe ser mayor a 0'),
  motivo: z.string().optional(),
})

export type MovimientoFormValues = z.infer<typeof movimientoSchema>
