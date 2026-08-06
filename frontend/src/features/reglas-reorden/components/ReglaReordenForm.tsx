import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { useProveedores } from '@/features/proveedores/hooks/useProveedores'
import {
  reglaReordenSchema,
  type ReglaReordenFormValues,
} from '@/features/reglas-reorden/schemas/reglaReordenSchema'
import { numeroDesdeTexto } from '@/lib/numericInput'

interface ReglaReordenFormProps {
  defaultValues?: ReglaReordenFormValues
  productoFijo?: string
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: ReglaReordenFormValues) => void
}

export function ReglaReordenForm({
  defaultValues,
  productoFijo,
  isPending,
  errorMessage,
  onSubmit,
}: ReglaReordenFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ReglaReordenFormValues>({
    resolver: zodResolver(reglaReordenSchema),
    defaultValues: defaultValues ?? { producto_id: null, proveedor_id: null },
  })
  // Fetches the largest page the backend allows (size=100): estos dropdowns necesitan el
  // catálogo completo, no una porción paginada.
  const { data: productosData } = useProductos('', 1, 100)
  const productos = productosData?.items ?? []
  const { data: proveedoresData } = useProveedores('', 1, 100)
  const proveedores = proveedoresData?.items.filter((proveedor) => proveedor.activo) ?? []

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      {productoFijo ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm leading-none font-medium">Producto</span>
          <p className="text-sm text-muted-foreground">{productoFijo}</p>
        </div>
      ) : (
        <SelectField
          control={control}
          name="producto_id"
          label="Producto"
          placeholder="Selecciona un producto"
          options={productos.map((producto) => ({ value: String(producto.id), label: producto.nombre }))}
          error={errors.producto_id}
          parse={(value) => Number(value)}
        />
      )}

      <SelectField
        control={control}
        name="proveedor_id"
        label="Proveedor"
        placeholder="Selecciona un proveedor"
        options={proveedores.map((proveedor) => ({ value: String(proveedor.id), label: proveedor.nombre }))}
        error={errors.proveedor_id}
        parse={(value) => Number(value)}
      />

      <FormField
        label="Umbral de stock (dispara la orden al llegar aquí)"
        type="number"
        register={register('umbral_stock', { setValueAs: numeroDesdeTexto })}
        error={errors.umbral_stock}
      />
      <FormField
        label="Cantidad a pedir"
        type="number"
        register={register('cantidad_pedido', { setValueAs: numeroDesdeTexto })}
        error={errors.cantidad_pedido}
      />
      <FormField
        label="Costo unitario estimado"
        type="number"
        register={register('costo_unitario_estimado', { setValueAs: numeroDesdeTexto })}
        error={errors.costo_unitario_estimado}
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
