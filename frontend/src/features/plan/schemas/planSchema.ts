import { z } from 'zod'

function validaLimiteEquipos(value: string | undefined) {
  if (!value) return true
  const parsed = Number(value)
  return !Number.isNaN(parsed) && Number.isInteger(parsed) && parsed >= 0
}

export const planSchema = z.object({
  limite_equipos: z
    .string()
    .optional()
    .refine(validaLimiteEquipos, { message: 'Debe ser un número entero mayor o igual a 0' }),
})

export type PlanFormValues = z.infer<typeof planSchema>
