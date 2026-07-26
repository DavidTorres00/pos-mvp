export function sumLineTotals<T>(items: readonly T[] | undefined, lineTotal: (item: T) => number): number {
  return (items ?? []).reduce((sum, item) => sum + lineTotal(item), 0)
}
