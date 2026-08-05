import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import { usuarioCreateSchema, type UsuarioCreateFormValues } from '@/features/usuarios/schemas/usuarioSchema'

interface UsuarioFormProps {
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: UsuarioCreateFormValues) => void
}

export function UsuarioForm({ isPending, errorMessage, onSubmit }: UsuarioFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<UsuarioCreateFormValues>({
    resolver: zodResolver(usuarioCreateSchema),
    defaultValues: { sucursal_id: null },
  })
  const { data: sucursalesData } = useSucursales('', 1, 100)
  const sucursales = sucursalesData?.items.filter((sucursal) => sucursal.activo) ?? []
  const sucursalOptions = sucursales.map((sucursal) => ({ value: String(sucursal.id), label: sucursal.nombre }))

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="Email" type="email" register={register('email')} error={errors.email} />
      <FormField label="Contraseña" type="password" register={register('password')} error={errors.password} />
      <SelectField
        control={control}
        name="sucursal_id"
        label="Sucursal"
        placeholder="Selecciona una sucursal"
        options={sucursalOptions}
        error={errors.sucursal_id}
        parse={(value) => Number(value)}
      />

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creando...' : 'Crear cajero'}
      </Button>
    </form>
  )
}
