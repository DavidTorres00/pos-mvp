import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'

interface ToggleableItem {
  id: number
  activo: boolean
}

interface ToggleVariables {
  id: number
  activo: boolean
}

export function useOptimisticToggle<T extends ToggleableItem>(
  queryKey: QueryKey,
  mutationFn: (variables: ToggleVariables) => Promise<T>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: async ({ id, activo }: ToggleVariables) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueriesData<T[]>({ queryKey })
      queryClient.setQueriesData<T[]>({ queryKey }, (items) =>
        items?.map((item) => (item.id === id ? { ...item, activo } : item)),
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
