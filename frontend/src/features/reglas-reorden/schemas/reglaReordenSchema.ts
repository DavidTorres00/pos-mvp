import { z } from 'zod'

export const reglaReordenSchema = z.object({
  producto_id: z.number().nullable(),
  proveedor_id: z.number().nullable(),
  umbral_stock: z.number().int().nonnegative('El umbral no puede ser negativo'),
  cantidad_pedido: z.number().int().positive('La cantidad debe ser mayor a 0'),
  costo_unitario_estimado: z.number().positive('El costo debe ser mayor a 0'),
})

export type ReglaReordenFormValues = z.infer<typeof reglaReordenSchema>
