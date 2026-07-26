import { z } from 'zod'

export const productoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  sku: z.string().min(1, 'El SKU es requerido'),
  precio_venta: z.number().positive('El precio debe ser mayor a 0'),
  categoria_id: z.number().nullable(),
})

export type ProductoFormValues = z.infer<typeof productoSchema>
