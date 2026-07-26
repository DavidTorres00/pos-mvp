import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'

import { useApiMutation } from '@/lib/hooks/useApiMutation'

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { wrapper, invalidateSpy }
}

describe('useApiMutation', () => {
  it('invalidates the given query keys on success', async () => {
    const { wrapper, invalidateSpy } = createWrapper()
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 })

    const { result } = renderHook(() => useApiMutation(mutationFn, [['productos'], ['movimientos']]), { wrapper })

    result.current.mutate({ id: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['productos'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['movimientos'] })
  })

  it('does not invalidate any query key on failure', async () => {
    const { wrapper, invalidateSpy } = createWrapper()
    const mutationFn = vi.fn().mockRejectedValue(new Error('fail'))

    const { result } = renderHook(() => useApiMutation(mutationFn, [['productos']]), { wrapper })

    result.current.mutate({ id: 1 })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalled()
  })
})
