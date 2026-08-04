import { z } from 'zod'

export const proveedorSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, { message: 'Email inválido' }),
  clabe: z
    .string()
    .optional()
    .refine((value) => !value || value.length === 18, { message: 'La CLABE debe tener 18 dígitos' }),
})

export type ProveedorFormValues = z.infer<typeof proveedorSchema>
