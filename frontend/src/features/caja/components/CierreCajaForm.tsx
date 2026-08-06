import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { cierreSchema, type CierreFormValues } from '@/features/caja/schemas/cajaSchema'
import { formatCurrency } from '@/lib/format'
import { numeroDesdeTexto } from '@/lib/numericInput'
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
    watch,
    setError,
    formState: { errors },
  } = useForm<CierreFormValues>({ resolver: zodResolver(cierreSchema) })

  // el faltante exige motivo (control real, no solo UX): sobra no es pérdida, no se exige nada,
  // pero se ofrece igual por si el cajero quiere dejar una nota (ej. "cliente no quiso su cambio")
  const montoFinal = watch('monto_final')
  const montoEsperado = resumen ? Number(resumen.monto_esperado) : null
  const diferencia = montoEsperado !== null && !Number.isNaN(montoFinal) ? montoFinal - montoEsperado : null
  const faltante = diferencia !== null && diferencia < 0

  function handleFormSubmit(values: CierreFormValues) {
    if (faltante && !values.motivo_diferencia?.trim()) {
      setError('motivo_diferencia', { message: 'Indica el motivo del faltante para poder cerrar' })
      return
    }
    onSubmit(values)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleFormSubmit)}>
      {resumen && (
        <div className="rounded-md border p-3 text-sm">
          <p>Monto inicial: {formatCurrency(resumen.caja.monto_inicial)}</p>
          <p>Ventas en efectivo: {formatCurrency(resumen.total_ventas_efectivo)}</p>
          <p>Otras entradas: {formatCurrency(resumen.total_entradas)}</p>
          <p>Otras salidas: {formatCurrency(resumen.total_salidas)}</p>
          <p className="font-semibold">Monto esperado: {formatCurrency(resumen.monto_esperado)}</p>
        </div>
      )}

      <FormField
        label="Monto final contado"
        type="number"
        register={register('monto_final', { setValueAs: numeroDesdeTexto })}
        error={errors.monto_final}
      />

      {diferencia !== null && diferencia !== 0 && (
        <FormField
          label={faltante ? 'Motivo del faltante' : 'Motivo del sobrante (opcional)'}
          placeholder={
            faltante ? 'Ej. error al dar cambio, billete no contado...' : 'Ej. cliente no quiso su cambio...'
          }
          register={register('motivo_diferencia')}
          error={errors.motivo_diferencia}
        />
      )}

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
