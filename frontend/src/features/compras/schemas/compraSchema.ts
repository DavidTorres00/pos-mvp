import { z } from 'zod'

export const compraSchema = z
  .object({
    proveedor: z.string().min(1, 'El proveedor es requerido'),
    items: z
      .array(
        z.object({
          producto_id: z.number().nullable(),
          cantidad: z.number().int().positive('Cantidad debe ser mayor a 0'),
          costo_unitario: z.number().positive('Costo debe ser mayor a 0'),
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

export type CompraFormValues = z.infer<typeof compraSchema>
