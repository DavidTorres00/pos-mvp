import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aperturaSchema, type AperturaFormValues } from '@/features/caja/schemas/cajaSchema'

interface AperturaCajaFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: AperturaFormValues) => void
}

export function AperturaCajaForm({ isPending, errorMessage, onSubmit }: AperturaCajaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AperturaFormValues>({ resolver: zodResolver(aperturaSchema) })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="monto_inicial">Monto inicial</Label>
        <Input id="monto_inicial" type="number" step="0.01" {...register('monto_inicial', { valueAsNumber: true })} />
        {errors.monto_inicial && <p className="text-sm text-destructive">{errors.monto_inicial.message}</p>}
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Abriendo...' : 'Abrir caja'}
      </Button>
    </form>
  )
}
