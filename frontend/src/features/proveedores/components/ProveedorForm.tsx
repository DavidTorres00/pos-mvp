import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { proveedorSchema, type ProveedorFormValues } from '@/features/proveedores/schemas/proveedorSchema'

interface ProveedorFormProps {
  defaultValues?: ProveedorFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: ProveedorFormValues) => void
}

export function ProveedorForm({ defaultValues, isPending, errorMessage, onSubmit }: ProveedorFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProveedorFormValues>({ resolver: zodResolver(proveedorSchema), defaultValues })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="Contacto" register={register('contacto')} error={errors.contacto} />
      <FormField label="Teléfono" register={register('telefono')} error={errors.telefono} />
      <FormField label="Email" type="email" register={register('email')} error={errors.email} />
      <FormField
        label="CLABE (pago automático)"
        placeholder="18 dígitos"
        register={register('clabe')}
        error={errors.clabe}
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
