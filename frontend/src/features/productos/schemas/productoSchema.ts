import { z } from 'zod'

export const productoSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    sku: z.string().nullable(),
    precio_venta: z.number({ error: 'Ingresa el precio de venta' }).positive('El precio debe ser mayor a 0'),
    // opcional a propósito (ver Producto.costo, docs/BACKEND.md): `null` = "no cargado
    // todavía", se sincroniza solo al recibir la primera compra
    costo: z.number().nullable().refine((v) => v === null || v >= 0, 'Debe ser un número mayor o igual a 0'),
    categoria_id: z.number().nullable(),
    subcategoria_id: z.number().nullable(),
    proveedor_id: z.number().nullable(),
  })
  .refine((data) => data.subcategoria_id !== null || !!data.sku, {
    message: 'El SKU es requerido si no eliges una subcategoría',
    path: ['sku'],
  })

export type ProductoFormValues = z.infer<typeof productoSchema>
