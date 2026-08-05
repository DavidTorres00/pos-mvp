import { z } from 'zod'

export const equipoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
})

export type EquipoFormValues = z.infer<typeof equipoSchema>
