import { isAxiosError } from 'axios'
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'

function isClientError(error: unknown): boolean {
  if (!isAxiosError(error) || !error.response) return false
  return error.response.status >= 400 && error.response.status < 500
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: () => {
      toast.error('No se pudo cargar la información. Intenta nuevamente.')
    },
  }),
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  )
}
