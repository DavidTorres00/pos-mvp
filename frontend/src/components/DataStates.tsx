import { AlertTriangleIcon, InboxIcon, Loader2Icon } from 'lucide-react'

interface StateMessageProps {
  message?: string
}

export function LoadingState({ message = 'Cargando...' }: StateMessageProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin text-muted-foreground/70" />
      <p>{message}</p>
    </div>
  )
}

export function EmptyState({ message = 'Todavía no hay nada por aquí.' }: StateMessageProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      <InboxIcon className="size-8 text-muted-foreground/50" />
      <p>{message}</p>
    </div>
  )
}

export function ErrorState({ message = 'Algo salió mal al cargar la información.' }: StateMessageProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 py-10 text-center text-sm text-destructive">
      <AlertTriangleIcon className="size-6 text-destructive/70" />
      <p>{message}</p>
    </div>
  )
}
