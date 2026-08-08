import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
    setValue,
    control,
    formState: { errors },
  } = useForm<UsuarioCreateFormValues>({
    resolver: zodResolver(usuarioCreateSchema),
    defaultValues: { sucursal_id: null },
  })
  const { data: sucursalesData } = useSucursales('', 1, 100)
  const sucursales = sucursalesData?.items.filter((sucursal) => sucursal.activo) ?? []
  const sucursalOptions = sucursales.map((sucursal) => ({ value: String(sucursal.id), label: sucursal.nombre }))

  // admin de una sola sucursal (ver docs/FRONTEND.md): no tiene sentido pedir una decisión sin
  // opciones reales — se autoselecciona y se muestra como etiqueta fija, mismo patrón que
  // `AbrirCajaSplash` con el equipo único. Sin `shouldValidate`: forzarlo expondría el error de
  // OTRO campo (nombre/email/password vacíos) antes de que el admin intente enviar el form.
  const unicaSucursalId = sucursales.length === 1 ? sucursales[0].id : undefined
  useEffect(() => {
    if (unicaSucursalId !== undefined) {
      setValue('sucursal_id', unicaSucursalId)
    }
  }, [unicaSucursalId, setValue])

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <FormField label="Email" type="email" register={register('email')} error={errors.email} />
      <FormField label="Contraseña" type="password" register={register('password')} error={errors.password} />
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
        {isPending ? 'Creando...' : 'Crear cajero'}
      </Button>
    </form>
  )
}
