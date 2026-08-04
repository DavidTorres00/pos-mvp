import type { ReactNode } from 'react'

import { ErrorState, LoadingState } from '@/components/DataStates'
import { Pagination } from '@/components/Pagination'

interface TableCardProps {
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  page: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  children: ReactNode
}

export function TableCard({
  isLoading,
  isError,
  errorMessage,
  page,
  pageCount,
  total,
  onPageChange,
  children,
}: TableCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message={errorMessage} bordered={false} />
      ) : (
        <>
          {children}
          {pageCount > 1 && (
            <div className="p-4">
              <Pagination page={page} pageCount={pageCount} total={total} onPageChange={onPageChange} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
