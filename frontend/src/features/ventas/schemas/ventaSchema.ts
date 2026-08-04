import { z } from 'zod'

export const ventaSchema = z
  .object({
    forma_pago: z.enum(['efectivo', 'tarjeta', 'transferencia']),
    items: z
      .array(
        z.object({
          producto_id: z.number().nullable(),
          cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
        }),
      )
      .min(1, 'Agrega al menos un producto'),
  })
  .superRefine((values, ctx) => {
    values.items.forEach((item, index) => {
      if (item.producto_id === null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Selecciona un producto',
          path: ['items', index, 'producto_id'],
        })
      }
    })
  })

export type VentaFormValues = z.infer<typeof ventaSchema>
