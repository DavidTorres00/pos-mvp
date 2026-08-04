import { z } from 'zod'

export const subcategoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
})

export type SubcategoriaFormValues = z.infer<typeof subcategoriaSchema>
