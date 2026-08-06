import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import {
  configuracionSchema,
  type ConfiguracionFormValues,
} from '@/features/configuracion/schemas/configuracionSchema'

interface ConfiguracionFormProps {
  defaultValues?: ConfiguracionFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: ConfiguracionFormValues) => void
}

export function ConfiguracionForm({ defaultValues, isPending, errorMessage, onSubmit }: ConfiguracionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfiguracionFormValues>({ resolver: zodResolver(configuracionSchema), defaultValues })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Límite de efectivo por caja"
        type="number"
        placeholder="Sin límite"
        register={register('limite_efectivo_caja')}
        error={errors.limite_efectivo_caja}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Al superarlo, se ofrece retirar el excedente y dejar la caja en el fondo inicial.
      </p>

      <FormField
        label="Tope de gasto por orden a proveedor (OpenPay)"
        type="number"
        placeholder="Sin tope"
        register={register('openpay_tope_por_orden')}
        error={errors.openpay_tope_por_orden}
      />

      <FormField
        label="Tope de gasto diario a proveedores (OpenPay)"
        type="number"
        placeholder="Sin tope"
        register={register('openpay_tope_diario')}
        error={errors.openpay_tope_diario}
      />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
