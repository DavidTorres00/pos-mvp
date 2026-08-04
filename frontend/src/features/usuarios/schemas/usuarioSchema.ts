import { z } from 'zod'

export const usuarioCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

export type UsuarioCreateFormValues = z.infer<typeof usuarioCreateSchema>
