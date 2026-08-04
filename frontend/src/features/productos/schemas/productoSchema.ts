import { z } from 'zod'

export const productoSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    sku: z.string().nullable(),
    precio_venta: z.number().positive('El precio debe ser mayor a 0'),
    categoria_id: z.number().nullable(),
    subcategoria_id: z.number().nullable(),
  })
  .refine((data) => data.subcategoria_id !== null || !!data.sku, {
    message: 'El SKU es requerido si no eliges una subcategoría',
    path: ['sku'],
  })

export type ProductoFormValues = z.infer<typeof productoSchema>
