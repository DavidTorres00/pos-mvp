import { useEffect, useState } from 'react'

// El backend pagina ahora (ver PaginatedResponse<T>): este hook solo trackea page/size local.
export function usePagination(size = 10, resetKey?: unknown) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  return { page, size, setPage }
}
