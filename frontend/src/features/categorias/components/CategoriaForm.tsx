import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { categoriaSchema, type CategoriaFormValues } from '@/features/categorias/schemas/categoriaSchema'

interface CategoriaFormProps {
  defaultValues?: CategoriaFormValues
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: CategoriaFormValues) => void
}

export function CategoriaForm({ defaultValues, isPending, errorMessage, onSubmit }: CategoriaFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoriaFormValues>({
    resolver: zodResolver(categoriaSchema),
    defaultValues,
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" {...register('nombre')} />
        {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
      </div>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  )
}
