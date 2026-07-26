import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CajaResumen } from '@/services/cajaService'
import { cierreSchema, type CierreFormValues } from '@/features/caja/schemas/cajaSchema'

interface CierreCajaFormProps {
  resumen: CajaResumen | undefined
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: CierreFormValues) => void
}

export function CierreCajaForm({ resumen, isPending, errorMessage, onSubmit }: CierreCajaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CierreFormValues>({ resolver: zodResolver(cierreSchema) })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      {resumen && (
        <div className="rounded-md border p-3 text-sm">
          <p>Monto inicial: ${resumen.caja.monto_inicial}</p>
          <p>Ventas en efectivo: ${resumen.total_ventas_efectivo}</p>
          <p>Entradas manuales: ${resumen.total_entradas}</p>
          <p>Salidas manuales: ${resumen.total_salidas}</p>
          <p className="font-semibold">Monto esperado: ${resumen.monto_esperado}</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="monto_final">Monto final contado</Label>
        <Input id="monto_final" type="number" step="0.01" {...register('monto_final', { valueAsNumber: true })} />
        {errors.monto_final && <p className="text-sm text-destructive">{errors.monto_final.message}</p>}
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Cerrando...' : 'Cerrar caja'}
      </Button>
    </form>
  )
}
