import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/form/SelectField'
import { useProductos } from '@/features/productos/hooks/useProductos'
import { useProveedores } from '@/features/proveedores/hooks/useProveedores'
import { compraSchema, type CompraFormValues } from '@/features/compras/schemas/compraSchema'
import { formatCurrency } from '@/lib/format'
import { sumLineTotals } from '@/lib/lineItems'
import { numeroDesdeTexto } from '@/lib/numericInput'

interface CompraFormProps {
  // fijo cuando el pedido se arma desde dentro del hub de un proveedor (ver ProveedoresPage,
  // docs/FRONTEND.md) — el select de proveedor se oculta, ya no hay que elegirlo
  proveedorFijo?: { id: number; nombre: string }
  // productos preseleccionados (bulk "Preparar pedido" desde la tabla de productos del
  // proveedor) — precarga una línea por producto, cantidad/costo en blanco para que el admin
  // los confirme, igual que una línea agregada a mano
  defaultProductoIds?: number[]
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: CompraFormValues) => void
}

function LineaTotal({ control, index }: { control: Control<CompraFormValues>; index: number }) {
  const cantidad = useWatch({ control, name: `items.${index}.cantidad` }) || 0
  const costo = useWatch({ control, name: `items.${index}.costo_unitario` }) || 0
  const subtotal = formatCurrency(cantidad * costo)
  return (
    <span className="w-24 text-sm tabular-nums" aria-label={`Subtotal: ${subtotal}`}>
      {subtotal}
    </span>
  )
}

export function CompraForm({ proveedorFijo, defaultProductoIds, isPending, errorMessage, onSubmit }: CompraFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      proveedor_id: proveedorFijo?.id ?? null,
      items:
        defaultProductoIds && defaultProductoIds.length > 0
          ? defaultProductoIds.map((producto_id) => ({ producto_id, cantidad: 1, costo_unitario: 0 }))
          : [{ producto_id: null, cantidad: 1, costo_unitario: 0 }],
    },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  // Fetches the largest page the backend allows (size=100) since estos dropdowns necesitan
  // el catálogo completo, no una porción paginada.
  const { data: productosData } = useProductos({ q: '' }, 1, 100)
  const productos = productosData?.items ?? []
  const { data: proveedoresData } = useProveedores('', 1, 100)
  const proveedores = proveedoresData?.items.filter((proveedor) => proveedor.activo) ?? []
  const items = useWatch({ control, name: 'items' })
  const total = sumLineTotals(items, (item) => (item?.cantidad || 0) * (item?.costo_unitario || 0))

  const productoOptions = productos.map((producto) => ({ value: String(producto.id), label: producto.nombre }))
  const proveedorOptions = proveedores.map((proveedor) => ({ value: String(proveedor.id), label: proveedor.nombre }))

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      {proveedorFijo ? (
        <p className="text-sm">
          Proveedor: <span className="font-medium">{proveedorFijo.nombre}</span>
        </p>
      ) : (
        <SelectField
          control={control}
          name="proveedor_id"
          label="Proveedor"
          placeholder="Selecciona un proveedor"
          options={proveedorOptions}
          error={errors.proveedor_id}
          parse={(value) => Number(value)}
        />
      )}

      <div className="flex flex-col gap-3">
        <span className="text-sm leading-none font-medium">Productos</span>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-end gap-2">
            <div className="flex-1">
              <SelectField
                control={control}
                name={`items.${index}.producto_id`}
                label={`Producto ${index + 1}`}
                hideLabel
                placeholder="Producto"
                options={productoOptions}
                error={errors.items?.[index]?.producto_id}
                parse={(value) => Number(value)}
              />
            </div>
            <Input
              type="number"
              placeholder="Cant."
              className="w-20"
              aria-label={`Cantidad producto ${index + 1}`}
              {...register(`items.${index}.cantidad`, { setValueAs: numeroDesdeTexto })}
            />
            <Input
              type="number"
              placeholder="Costo"
              className="w-24"
              aria-label={`Costo unitario producto ${index + 1}`}
              {...register(`items.${index}.costo_unitario`, { setValueAs: numeroDesdeTexto })}
            />
            <LineaTotal control={control} index={index} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Quitar producto ${index + 1}`}
              onClick={() => remove(index)}
            >
              Quitar
            </Button>
          </div>
        ))}
        {errors.items?.message && (
          <p role="alert" className="text-sm text-destructive">
            {errors.items.message}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ producto_id: null, cantidad: 1, costo_unitario: 0 })}
        >
          Agregar producto
        </Button>
      </div>

      <p className="text-right font-semibold">Total: {formatCurrency(total)}</p>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar pedido'}
      </Button>
    </form>
  )
}
