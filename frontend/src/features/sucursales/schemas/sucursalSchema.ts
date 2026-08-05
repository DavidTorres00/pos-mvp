import { z } from 'zod'

export const sucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
})

export type SucursalFormValues = z.infer<typeof sucursalSchema>
