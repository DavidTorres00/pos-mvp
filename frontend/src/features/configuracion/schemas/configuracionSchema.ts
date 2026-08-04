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

export const configuracionSchema = z.object({
  limite_efectivo_caja: numeroOpcional,
  openpay_tope_por_orden: numeroOpcional,
  openpay_tope_diario: numeroOpcional,
})

export type ConfiguracionFormValues = z.infer<typeof configuracionSchema>
