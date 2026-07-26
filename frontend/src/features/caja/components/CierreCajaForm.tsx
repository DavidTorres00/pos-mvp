import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { cierreSchema, type CierreFormValues } from '@/features/caja/schemas/cajaSchema'
import { formatCurrency } from '@/lib/format'
import type { CajaResumen } from '@/services/cajaService'

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
          <p>Monto inicial: {formatCurrency(resumen.caja.monto_inicial)}</p>
          <p>Ventas en efectivo: {formatCurrency(resumen.total_ventas_efectivo)}</p>
          <p>Entradas manuales: {formatCurrency(resumen.total_entradas)}</p>
          <p>Salidas manuales: {formatCurrency(resumen.total_salidas)}</p>
          <p className="font-semibold">Monto esperado: {formatCurrency(resumen.monto_esperado)}</p>
        </div>
      )}

      <FormField
        label="Monto final contado"
        type="number"
        step="0.01"
        register={register('monto_final', { valueAsNumber: true })}
        error={errors.monto_final}
      />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Cerrando...' : 'Cerrar caja'}
      </Button>
    </form>
  )
}
