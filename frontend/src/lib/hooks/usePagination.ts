import { useEffect, useState } from 'react'

export function usePagination<T>(items: T[], pageSize = 10, resetKey?: unknown) {
  const [page, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize

  useEffect(() => {
    setPage(1)
  }, [resetKey])

  return {
    page: currentPage,
    pageCount,
    setPage,
    total: items.length,
    pageItems: items.slice(start, start + pageSize),
  }
}
