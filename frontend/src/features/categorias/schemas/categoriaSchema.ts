import { z } from 'zod'

export const categoriaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
})

export type CategoriaFormValues = z.infer<typeof categoriaSchema>
