import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
import { useSucursales } from '@/features/sucursales/hooks/useSucursales'
import { usuarioEditSchema, type UsuarioEditFormValues } from '@/features/usuarios/schemas/usuarioSchema'

interface UsuarioEditFormProps {
  defaultValues: UsuarioEditFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: UsuarioEditFormValues) => void
}

export function UsuarioEditForm({ defaultValues, isPending, errorMessage, onSubmit }: UsuarioEditFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<UsuarioEditFormValues>({ resolver: zodResolver(usuarioEditSchema), defaultValues })
  const { data: sucursalesData } = useSucursales('', 1, 100)
  const sucursales = sucursalesData?.items.filter((sucursal) => sucursal.activo) ?? []
  const sucursalOptions = sucursales.map((sucursal) => ({ value: String(sucursal.id), label: sucursal.nombre }))

  // admin de una sola sucursal (ver docs/FRONTEND.md): mismo patrón que UsuarioForm — con 1
  // sola sucursal activa no hay ninguna decisión real que ofrecer, se autoselecciona. Solo pisa
  // el valor si todavía no había uno (edición ya trae el sucursal_id real del cajero).
  const unicaSucursalId = sucursales.length === 1 ? sucursales[0].id : undefined
  useEffect(() => {
    if (unicaSucursalId !== undefined && defaultValues.sucursal_id === null) {
      setValue('sucursal_id', unicaSucursalId)
    }
  }, [unicaSucursalId, defaultValues.sucursal_id, setValue])

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="Email" type="email" register={register('email')} error={errors.email} />
      {sucursales.length > 1 ? (
        <SelectField
          control={control}
          name="sucursal_id"
          label="Sucursal"
          placeholder="Selecciona una sucursal"
          options={sucursalOptions}
          error={errors.sucursal_id}
          parse={(value) => Number(value)}
        />
      ) : (
        sucursales.length === 1 && (
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Sucursal</Label>
            <p className="text-sm font-medium text-foreground">{sucursales[0].nombre}</p>
          </div>
        )
      )}

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
