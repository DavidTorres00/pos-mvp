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
        label="Límite de efectivo por caja (default global)"
        type="number"
        placeholder="Sin límite"
        register={register('limite_efectivo_caja')}
        error={errors.limite_efectivo_caja}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Al superarlo, se ofrece retirar el excedente y dejar la caja en el fondo inicial. Cada sucursal puede
        sobreescribirlo con su propio límite desde Sucursales.
      </p>

      <FormField
        label="Umbral de stock bajo"
        type="number"
        placeholder="Desactivado"
        register={register('umbral_stock_bajo_default')}
        error={errors.umbral_stock_bajo_default}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Avisa en el Dashboard cuando un producto cae en o debajo de esta cantidad.
      </p>

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
