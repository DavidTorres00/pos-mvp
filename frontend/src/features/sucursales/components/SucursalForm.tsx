import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { sucursalSchema, type SucursalFormValues } from '@/features/sucursales/schemas/sucursalSchema'

interface SucursalFormProps {
  defaultValues?: SucursalFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: SucursalFormValues) => void
}

export function SucursalForm({ defaultValues, isPending, errorMessage, onSubmit }: SucursalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SucursalFormValues>({ resolver: zodResolver(sucursalSchema), defaultValues })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="Dirección" register={register('direccion')} error={errors.direccion} />
      <FormField label="Responsable" register={register('responsable')} error={errors.responsable} />
      <FormField label="Teléfono" register={register('telefono')} error={errors.telefono} />

      <FormField
        label="Límite de efectivo por caja"
        type="number"
        placeholder="Usa el límite global"
        register={register('limite_efectivo_caja')}
        error={errors.limite_efectivo_caja}
      />
      <p className="-mt-2 text-xs text-muted-foreground">
        Sobreescribe el límite global de esta sucursal. Vacío = usa el de Configuración.
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
