import { z } from 'zod'

function validaNumeroOpcional(value: string | undefined) {
  if (!value) return true
  const parsed = Number(value)
  return !Number.isNaN(parsed) && parsed >= 0
}

const numeroOpcional = z
  .string()
  .optional()
  .refine(validaNumeroOpcional, { message: 'Debe ser un número mayor o igual a 0' })

export const sucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().optional(),
  responsable: z.string().optional(),
  telefono: z.string().optional(),
  limite_efectivo_caja: numeroOpcional,
})

export type SucursalFormValues = z.infer<typeof sucursalSchema>
