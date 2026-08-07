import { z } from 'zod'

export const usuarioCreateSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    sucursal_id: z.number().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.sucursal_id === null) {
      ctx.addIssue({ code: 'custom', message: 'Selecciona una sucursal', path: ['sucursal_id'] })
    }
  })

export type UsuarioCreateFormValues = z.infer<typeof usuarioCreateSchema>

export const usuarioNombreSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
})

export type UsuarioNombreFormValues = z.infer<typeof usuarioNombreSchema>
