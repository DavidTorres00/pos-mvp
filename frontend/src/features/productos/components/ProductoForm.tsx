import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormField } from '@/components/form/FormField'
import { SelectField } from '@/components/form/SelectField'
import { useCategorias } from '@/features/categorias/hooks/useCategorias'
import { productoSchema, type ProductoFormValues } from '@/features/productos/schemas/productoSchema'
import { useProveedores } from '@/features/proveedores/hooks/useProveedores'
import { useSubcategorias } from '@/features/subcategorias/hooks/useSubcategorias'
import { numeroDesdeTexto, numeroOpcionalDesdeTexto } from '@/lib/numericInput'

const SIN_CATEGORIA = 'sin-categoria'
const SIN_SUBCATEGORIA = 'sin-subcategoria'
const SIN_PROVEEDOR = 'sin-proveedor'

interface ProductoFormProps {
  defaultValues?: ProductoFormValues
  // categoría precargada al crear desde el detalle de una categoría (hub de Productos) — se
  // ignora si `defaultValues` viene (edición), y no cuenta como "está editando"
  defaultCategoriaId?: number | null
  // proveedor precargado al crear desde el detalle de un proveedor (hub de Proveedores) —
  // mismo criterio que defaultCategoriaId
  defaultProveedorId?: number | null
  isPending: boolean
  errorMessage?: string
  onSubmit: (values: ProductoFormValues) => void
}

export function ProductoForm({
  defaultValues,
  defaultCategoriaId = null,
  defaultProveedorId = null,
  isPending,
  errorMessage,
  onSubmit,
}: ProductoFormProps) {
  const isEditing = defaultValues !== undefined
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues:
      defaultValues ?? {
        categoria_id: defaultCategoriaId,
        subcategoria_id: null,
        sku: null,
        costo: null,
        proveedor_id: defaultProveedorId,
      },
  })
  // Fetches the largest page the backend allows (size=100) since this dropdown needs the
  // full catalog, not a paginated slice.
  const { data: categoriasData } = useCategorias('', null, 1, 100)
  const categorias = categoriasData?.items ?? []
  const { data: proveedoresData } = useProveedores('', 1, 100)
  const proveedores = proveedoresData?.items.filter((proveedor) => proveedor.activo) ?? []

  const categoriaId = useWatch({ control, name: 'categoria_id' })
  const subcategoriaId = useWatch({ control, name: 'subcategoria_id' })
  const previousCategoriaId = useRef(categoriaId)
  useEffect(() => {
    if (previousCategoriaId.current !== categoriaId) {
      setValue('subcategoria_id', null)
      previousCategoriaId.current = categoriaId
    }
  }, [categoriaId, setValue])

  const { data: subcategoriasData } = useSubcategorias(categoriaId)
  const subcategorias = subcategoriasData?.items ?? []

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <FormField label="Nombre" register={register('nombre')} error={errors.nombre} />
      <SelectField
        control={control}
        name="categoria_id"
        label="Categoría"
        placeholder="Sin categoría"
        error={errors.categoria_id}
        options={[
          { value: SIN_CATEGORIA, label: 'Sin categoría' },
          ...categorias.map((categoria) => ({ value: String(categoria.id), label: categoria.nombre })),
        ]}
        serialize={(value) => (value === null ? SIN_CATEGORIA : String(value))}
        parse={(value) => (value === SIN_CATEGORIA ? null : Number(value))}
      />
      {categoriaId !== null && (
        <SelectField
          control={control}
          name="subcategoria_id"
          label="Subcategoría"
          placeholder="Sin subcategoría"
          error={errors.subcategoria_id}
          options={[
            { value: SIN_SUBCATEGORIA, label: 'Sin subcategoría' },
            ...subcategorias.map((subcategoria) => ({ value: String(subcategoria.id), label: subcategoria.nombre })),
          ]}
          serialize={(value) => (value === null ? SIN_SUBCATEGORIA : String(value))}
          parse={(value) => (value === SIN_SUBCATEGORIA ? null : Number(value))}
        />
      )}
      {(isEditing || subcategoriaId === null) && (
        <FormField label="SKU" register={register('sku')} error={errors.sku} />
      )}
      {!isEditing && subcategoriaId !== null && (
        <p className="text-sm text-muted-foreground">El SKU se genera automático según la subcategoría elegida.</p>
      )}
      <FormField
        label="Precio de venta"
        type="number"
        register={register('precio_venta', { setValueAs: numeroDesdeTexto })}
        error={errors.precio_venta}
      />
      <FormField
        label="Costo"
        type="number"
        placeholder="Se actualiza solo al recibir un pedido"
        register={register('costo', { setValueAs: numeroOpcionalDesdeTexto })}
        error={errors.costo}
      />
      <SelectField
        control={control}
        name="proveedor_id"
        label="Proveedor"
        placeholder="Sin proveedor"
        error={errors.proveedor_id}
        options={[
          { value: SIN_PROVEEDOR, label: 'Sin proveedor' },
          ...proveedores.map((proveedor) => ({ value: String(proveedor.id), label: proveedor.nombre })),
        ]}
        serialize={(value) => (value === null ? SIN_PROVEEDOR : String(value))}
        parse={(value) => (value === SIN_PROVEEDOR ? null : Number(value))}
      />
      <p className="-mt-2 text-xs text-muted-foreground">Quién surte este producto habitualmente (opcional).</p>

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
