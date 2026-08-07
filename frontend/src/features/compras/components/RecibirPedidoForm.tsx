import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { numeroDesdeTexto } from '@/lib/numericInput'
import type { Compra, RecibirCompraItemPayload } from '@/services/compraService'

interface RecibirPedidoFormValues {
  cantidades: Record<string, number>
}

interface RecibirPedidoFormProps {
  pedido: Compra
  isPending: boolean
  errorMessage?: string
  onSubmit: (items: RecibirCompraItemPayload[]) => void
}

// Cantidad recibida por línea, default = lo pedido — editable si el proveedor entregó
// incompleto o de más. Solo se habilita para pedidos ya `pagada` (ver docs/BACKEND.md).
export function RecibirPedidoForm({ pedido, isPending, errorMessage, onSubmit }: RecibirPedidoFormProps) {
  const { register, handleSubmit } = useForm<RecibirPedidoFormValues>({
    defaultValues: {
      cantidades: Object.fromEntries(pedido.items.map((item) => [item.producto_id, item.cantidad])),
    },
  })

  function handleFormSubmit(values: RecibirPedidoFormValues) {
    onSubmit(
      pedido.items.map((item) => {
        const cantidad = values.cantidades[item.producto_id]
        return { producto_id: item.producto_id, cantidad_recibida: Number.isFinite(cantidad) ? cantidad : 0 }
      }),
    )
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="flex flex-col gap-3">
        {pedido.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{item.producto.nombre}</span>
              <span className="text-xs text-muted-foreground">Pedido: {item.cantidad}</span>
            </div>
            <Input
              type="number"
              className="w-24"
              aria-label={`Cantidad recibida de ${item.producto.nombre}`}
              {...register(`cantidades.${item.producto_id}`, { setValueAs: numeroDesdeTexto })}
            />
          </div>
        ))}
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Confirmar recepción'}
      </Button>
    </form>
  )
}
