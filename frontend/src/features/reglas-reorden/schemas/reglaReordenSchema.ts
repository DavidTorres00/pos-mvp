import { z } from 'zod'

export const reglaReordenSchema = z.object({
  producto_id: z.number().nullable(),
  proveedor_id: z.number().nullable(),
  umbral_stock: z
    .number({ error: 'Ingresa el umbral de stock' })
    .int('El umbral debe ser un número entero')
    .nonnegative('El umbral no puede ser negativo'),
  cantidad_pedido: z
    .number({ error: 'Ingresa la cantidad a pedir' })
    .int('La cantidad debe ser un número entero')
    .positive('La cantidad debe ser mayor a 0'),
  costo_unitario_estimado: z.number({ error: 'Ingresa el costo unitario estimado' }).positive('El costo debe ser mayor a 0'),
})

export type ReglaReordenFormValues = z.infer<typeof reglaReordenSchema>
