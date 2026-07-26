import { useState } from 'react'

export function useCrudDialogState<T>() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)

  return {
    createOpen,
    setCreateOpen,
    closeCreate: () => setCreateOpen(false),
    editing,
    edit: setEditing,
    closeEdit: () => setEditing(null),
  }
}
